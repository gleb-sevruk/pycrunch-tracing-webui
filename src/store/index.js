// @flow

import Vue from 'vue'
import Vuex, {ActionContext} from 'vuex'
import io from 'socket.io-client'
import {short} from '../views/code/short-filename'
let goog = require('google-protobuf');
let messages = require("../proto/message_pb")


Vue.use(Vuex)

Array.prototype.filterInPlace = function (condition, thisArg) {
  let j = 0

  this.forEach((el, index) => {
    if (condition.call(thisArg, el, index, this)) {
      if (index !== j) {
        this[j] = el
      }
      j++
    }
  })

  this.length = j
  return this
}

class ExecutionCursor {
  line: number
  file: string
}

class StackFrame {
  id: number
  line: number
  file: string

  parent_id: number

  constructor (id: number, file: string, line: number, parent_id: number) {
    this.id = id
    this.file = file
    this.line = line
    this.parent_id = parent_id
  }
}

class CodeFile {
  filename: string
  contents: string
}

class Variable {
  name: string
  value: string
  
  constructor (name: string, value: string) {
    this.name = name
    this.value = value
  }
}

class CodeEvent {
  event_name : string
  stack_id : number
  cursor: ExecutionCursor
  locals: Variables

  constructor (event_name: string,
               cursor: ExecutionCursor,
               stack_id: number,
               locals: Array<Variable>,
               input_variables: Array<Variable>,
               return_variables: Array<Variable>
               ) {
    this.event_name = event_name
    this.cursor = cursor
    this.stack_id = stack_id
    this.locals = locals
    this.input_variables = input_variables
    this.return_variables = return_variables

  }

}

class LiveTracker {
  sid: string
  version: string

  constructor (sid, version: string) {
    this.sid = sid
    this.version = version
  }
}

function default_widgets (): Array<UiWidget> {
  let array = []
  array.push(new UiWidget('main.filename'))
  array.push(new UiWidget('widgets.inspector'))
  array.push(new UiWidget('toolbar.surface'))
  array.push(new UiWidget('main.sidebar'))
  array.push(new UiWidget('main.ignored_files'))

  return array
}

class UiWidget {
  name: string
  is_visible: boolean
  configuration: any

  constructor (name: string) {
    this.name = name
    this.is_visible = true
  }
}


class UiState {
  panels: Array<UiWidget> = default_widgets()
  follow_cursor: boolean = true
  file_filters: Array<string> = []

  ignore_file (filename: string) {
    console.log(filename)
    if (this.file_filters.indexOf(filename) < 0) {
      this.file_filters.push(filename)
    }
  }

  unignore_file (filename: string) {
    console.log(filename)
    let indexOf = this.file_filters.indexOf(filename)
    if (indexOf >= 0) {
      this.file_filters.splice(indexOf, 1)
    }
  }

  is_filtered (command: CodeEvent) {
    let file = command.cursor.file
    return this.file_filters.indexOf(file) >= 0
  }

  is_panel_visible (panel: string) {
    let optional: ?UiWidget = this.panels.find((_: UiWidget) => _.name === panel)
    if (optional) {
      return optional.is_visible
    }
  }

  toggle_panel (panel: string) {
    let optional: ?UiWidget = this.panels.find((_: UiWidget) => _.name === panel)
    if (optional) {
      optional.is_visible = !optional.is_visible
    }
  }

}

class TracingSession {
  name: string
  metadata: any
  short_name: string
}

class ProfileDetails {
  profile_name: string
  exclusions: Array<string>
}

class MyState {
  x: string = '11'
  is_connected: boolean = false
  current_session: TracingSession = null
  selected_file: CodeFile

  // entire_command_buffer: Array<CodeEvent> = []
  // command_buffer: Array<CodeEvent> = []
  // all_stacks: Array<StackFrame> = []

  files: Array<CodeFile> = []
  active_trackers: Array<LiveTracker> = []
  selected_index: number = 0
  selected_event: CodeEvent = null
  ui: UiState = new UiState()
  tracing_sessions: Array<TracingSession> = []
  total_events : number = 0
  profiles: Array<string> = []
  profile_details: ProfileDetails = null
}

function getState (): MyState {
  return new MyState()
}

let entire_command_buffer : Array<CodeEvent>  = []
let command_buffer : Array<CodeEvent>  = []
export let all_stacks :  Array<StackFrame> = []
let socket = io('http://0.0.0.0:8080')

export default new Vuex.Store({
  state: getState(),
  mutations: {
    profile_details_did_load(state: MyState, payload: Any) {
      state.profile_details = payload
    },
    profiles_did_load(state: MyState, payload: Any) {
      state.profiles.length = 0
      payload.profiles.forEach((_: string) => {
        state.profiles.push(_)
      })
    },
    session_will_load (state: MyState, session_name: string) {
      let currentSession = state.tracing_sessions.find((_: TracingSession) => _.short_name === session_name)
      if (currentSession) {
        state.current_session = currentSession
      }
    },
    did_unignore_file (state: MyState, filename: string) {
      state.ui.unignore_file(filename)
    },
    did_ignore_file (state: MyState, filename: string) {
      state.ui.ignore_file(filename)
    },
    did_connect (state: MyState) {
      state.is_connected = true
    },
    did_disconnect (state: MyState) {
      state.is_connected = false
    },
    new_tracker_did_connect (state: MyState, data) {
      state.active_trackers.push(new LiveTracker(data.sid, data.version))
    },
    tracker_did_disconnect (state: MyState, sid) {
      console.log('tracker_did_disconnect')
      let possibleSession = state.active_trackers.find((_: LiveTracker) => _.sid === sid)

      if (possibleSession) {
        state.active_trackers.splice(state.active_trackers.indexOf(possibleSession), 1)
      }
    },

    update_filtered_events(state: MyState, payload) {
      command_buffer.length = 0
      let back_buffer = []
      entire_command_buffer.forEach(_ => {
        if (!state.ui.is_filtered(_)) {
          back_buffer.push(_)
        }
      })
      command_buffer = [...back_buffer]
      state.total_events = command_buffer.length
    },
    did_receive_buffer (state: MyState, payload) {
      let useProtobuf = true
      if (useProtobuf) {
        let xx = messages.TraceSession.deserializeBinary(payload)
        let events = xx.getEventsList()
        entire_command_buffer.length = 0
        let back_buffer = []
        events.forEach(_ => {
          let cursor_pb = _.getCursor()
          let cursor = new ExecutionCursor()
          cursor.file = cursor_pb.getFile()
          cursor.line = cursor_pb.getLine()
          let all_locals = []
          let locals = _.getLocals()
          if (locals) {
            let list = locals.getVariablesList()
            list.forEach(__ => {
              all_locals.push(new Variable(__.getName(), __.getValue()))
            })
          }

          let all_input = []
          let input = _.getInputVariables()
          if (input) {
            let list = input.getVariablesList()
            list.forEach(__ => {
              all_input.push(new Variable(__.getName(), __.getValue()))
            })
          }
          let all_returns = []
          let return_vars = _.getReturnVariables()
          if (return_vars) {
            let list = return_vars.getVariablesList()
            list.forEach(__ => {
              all_returns.push(new Variable(__.getName(), __.getValue()))
            })
          }
          let x = new CodeEvent(_.getEventName(),  cursor, _.getStackId(), all_locals, all_input, all_returns)
          back_buffer.push(x)
        })
        let back_stack = []
        all_stacks.length = 0

        let stacks = xx.getStackFramesList()
        stacks.forEach(_ => {
          let x = new StackFrame(_.getId(), _.getFile(), _.getLine(), _.getParentId())
          back_stack.push(x)
        })

        entire_command_buffer = [...back_buffer]
        all_stacks = [...back_stack]

        // let x = goog.require('proto.TraceSession');
        // debugger
      } else {
        let parse = JSON.parse(payload)
        entire_command_buffer.length = 0
        entire_command_buffer = [...parse]

      }
    },
    file_did_load (state: MyState, payload) {
      let x = new CodeFile()
      x.filename = payload.filename
      x.contents = payload.contents
      state.files.filterInPlace(function (_: CodeFile) {
        return _.filename !== x.filename
      })

      state.files.push(x)
    },
    selected_file_will_change (state: MyState, payload) {
      state.selected_file = state.files[0]
    },

    selected_index_will_change (state: MyState, payload) {
      function follow_cursor_if_enabled (state) {
        if (!state.ui.follow_cursor) {
          return
        }
        console.group('scroll decision')
        let newTop = state.selected_event.cursor.line * 22 - 100
        let scrollTop = window.scrollY
        let up_treshold = scrollTop - 200
        if (up_treshold < 0) {
          up_treshold = 0
        }

        let down_treshold = scrollTop + 100
        let needScroll = false
        let newTopLessTres = newTop < up_treshold
        let newTopGreaterDown = newTop > down_treshold
        if (newTopLessTres || newTopGreaterDown) {
          needScroll = true
        }
        // console.table({needScroll,newTop, scrollTop,
        // up_treshold, down_treshold,
        // needScroll, newTopLessTres, newTopGreaterDown} )

        if (needScroll) {
          // console.log('scrolling to ', newTop)
          setTimeout(() => {
            window.scrollTo({
              top: newTop,
              // behavior: 'smooth'
            })
          }, 100)
        }

        console.groupEnd()
      }

      let old_index = state.selected_index
      let new_index = payload

      state.selected_index = new_index
      state.selected_event = command_buffer[new_index]
      follow_cursor_if_enabled(state)
    },
    will_toggle_ui_panel (state: MyState, panel_name: string) {
      state.ui.toggle_panel(panel_name)
    },
    toggle_ui_follow_cursor (state: MyState, payload) {
      state.ui.follow_cursor = !state.ui.follow_cursor
    },
    session_list_did_load (state: MyState, payload: Array<any>) {
      state.tracing_sessions.length = 0
      payload.forEach(_ => state.tracing_sessions.push(_))
    },
    add_new_ignore_rule (state: MyState, payload: Array<any>) {
      state.profile_details.exclusions.push(payload)
      // payload.forEach(_ => state.tracing_sessions.push(_))
    },
    remove_ignore_rule (state: MyState, payload: string) {
      let indexOf = state.profile_details.exclusions.indexOf(payload)
      if (indexOf >= 0) {
        state.profile_details.exclusions.splice(indexOf, 1)
      }
      // payload.forEach(_ => state.tracing_sessions.push(_))
    },
  },
  actions: {
    load_profile_details(context: ActionContext, profile_name: string) {
      socket.emit('event', {
        action: 'load_profile_details',
        profile_name: profile_name,
      })
    },
    save_profile_details(context: ActionContext, dummy: Any) {
      let state : MyState = context.state
      socket.emit('event', {
        action: 'save_profile_details',
        profile: state.profile_details,
      })
    },

    unignore_file (context: ActionContext, filename: string) {
      context.commit('did_unignore_file', filename)
      context.commit('update_filtered_events')
    },
    ignore_current_file (context: ActionContext) {
      let selected_event: CodeEvent = context.state.selected_event
      context.commit('did_ignore_file', selected_event.cursor.file)
      context.commit('update_filtered_events')
    },

    load_file (context: ActionContext, payload) {
      socket.emit('event', {
        action: 'load_file',
        file_to_load: payload.file,
      })
    },
    load_session (context: ActionContext, payload) {
      context.commit('session_will_load', payload)

      socket.emit('event', {
        action: 'load_single_session',
        session_name: payload,
      })
    },
    async connect (context: ActionContext) {
      socket.on('connect', on_connect)

      async function on_connect () {
        context.commit('did_connect')
        console.log(socket.connected) // true
        // context.dispatch('load_command_buffer')
        context.dispatch('load_sessions')
        context.dispatch('load_profiles')


      }

      socket.on('disconnect', () => {
        context.commit('did_disconnect')
      })
      socket.on('reply', (data) => {
        context.commit('did_receive_buffer', data)
        context.commit('update_filtered_events')
        context.commit('selected_index_will_change', 0)

        let files = new Set()

        command_buffer.forEach(value => {
          if (value.cursor) {
            files.add(value.cursor.file)
          }
        })

        files.forEach(_ => context.dispatch('load_file', {file: _}))

      })
      socket.on('file_did_load', (data) => {
        context.commit('file_did_load', data)
        context.commit('selected_file_will_change')
      })

      socket.on('session_list_loaded', (data) => {
        context.commit('session_list_did_load', data)
      })
      socket.on('profiles_loaded', (data) => {
        context.commit('profiles_did_load', data)
      })
      socket.on('profile_details_loaded', (data) => {
        context.commit('profile_details_did_load', data)
      })
      socket.on('front', (data) => {

        // console.group('front event')
        // console.table(data)
        // console.groupEnd()
        if (data.event_name) {
          let e = data.event_name
          if (e === 'new_tracker') {
            context.commit('new_tracker_did_connect', data)


          } else if (e === 'tracker_did_disconnect') {
            context.commit('tracker_did_disconnect', data.sid)


          }

        }
      })
      // // socket.connect()
      // socket.emit('event', {data:1})

    },
    load_command_buffer (context: ActionContext) {
      socket.emit('event', {
        action: 'load_buffer',
      })

    },
    load_sessions (context: ActionContext) {
      socket.emit('event', {
        action: 'load_sessions',
      })

    },
    load_profiles (context: ActionContext) {
      socket.emit('event', {
        action: 'load_profiles',
      })

    },
    debug_next_line (context: ActionContext) {
      let x: MyState = context.state


      let attempt_index = context.state.selected_index + 1

      context.commit('selected_index_will_change', attempt_index)
    },
    step_back_over (context: ActionContext) {
      let x: MyState = context.state
      let attempt_index = context.state.selected_index - 1

      let evt: CodeEvent = command_buffer[attempt_index]
      // seek backward
      let found_exit = false
      let depth_stack = []
      if (evt.event_name === 'method_exit') {
        // we are going deeper back
        depth_stack.push(attempt_index)
        //  |
        //  ->
        //    ->
        //    <-
        //  <-
        while (!found_exit) {
          attempt_index -= 1
          let next_event = command_buffer[attempt_index]
          if (next_event.event_name === 'method_exit') {
            depth_stack.push(attempt_index)
          }
          if (next_event.event_name === 'method_enter') {
            depth_stack.pop(attempt_index)
            if (depth_stack.length === 0) {
              found_exit = true
              attempt_index -= 1
            }
          }
        }
        //  skip to 'method_enter - 1'

      }
      context.commit('selected_index_will_change', attempt_index)

    },
    step_over (context: ActionContext) {
      let x: MyState = context.state
      let attempt_index = context.state.selected_index + 1

      let evt: CodeEvent = command_buffer[attempt_index]

      let found_exit = false
      let depth_stack = []
      // seek forward
      if (evt.event_name === 'method_enter') {
        depth_stack.push(attempt_index)
        //  |
        //  ->
        //    ->
        //    <-
        //  <-
        while (!found_exit) {
          attempt_index += 1
          let next_event = command_buffer[attempt_index]
          if (next_event.event_name === 'method_enter') {
            depth_stack.push(attempt_index)
          }
          if (next_event.event_name === 'method_exit') {
            depth_stack.pop(attempt_index)
            if (depth_stack.length === 0) {
              found_exit = true
              attempt_index += 1
            }
          }
        }
      //  skip to 'method_exit'
      }
      context.commit('selected_index_will_change', attempt_index)
    },
    debug_previous_line (context: ActionContext) {
      context.commit('selected_index_will_change', context.state.selected_index - 1)
    },
  },
  getters: {
    is_panel_visible: (state: MyState) => panel => {
      return state.ui.is_panel_visible(panel)
    },
    short_filename: state => full => {
      return short(full)
    },
    selected_file: (state: MyState) => {
      let selected_event = state.selected_event
      if (selected_event) {
        return state.files.find((value: CodeFile) => value.filename === selected_event.cursor.file)
      }
    },


  },
  modules: {
    // code_editor: {
    //   state: {
    //     selected_file: null
    //   }
    // },
  },
  strict: true,
})
