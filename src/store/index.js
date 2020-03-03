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

class MyState {
  x: string = '11'
  is_connected: boolean = false
  current_session: TracingSession = null
  selected_file: CodeFile
  entire_command_buffer: Array<CodeEvent> = []
  all_stacks: Array<StackFrame> = []
  command_buffer: Array<CodeEvent> = []

  files: Array<CodeFile> = []
  active_trackers: Array<LiveTracker> = []
  selected_index: number = 0
  selected_event: CodeEvent
  ui: UiState = new UiState()
  tracing_sessions: Array<TracingSession> = []
}

function getState (): MyState {
  return new MyState()
}

let socket = io('http://0.0.0.0:8080')

export default new Vuex.Store({
  state: getState(),
  mutations: {

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
      state.command_buffer.length = 0
      let back_buffer = []
      state.entire_command_buffer.forEach(_ => {
        if (!state.ui.is_filtered(_)) {
          back_buffer.push(_)
        }
      })
      state.command_buffer = [...back_buffer]
    },
    did_receive_buffer (state: MyState, payload) {
      let useProtobuf = true
      if (useProtobuf) {
        let xx = messages.TraceSession.deserializeBinary(payload)
        let events = xx.getEventsList()
        state.entire_command_buffer.length = 0
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
        state.all_stacks.length = 0

        let stacks = xx.getStackFramesList()
        stacks.forEach(_ => {
          let x = new StackFrame(_.getId(), _.getFile(), _.getLine(), _.getParentId())
          back_stack.push(x)
        })

        state.entire_command_buffer = [...back_buffer]
        state.all_stacks = [...back_stack]

        // let x = goog.require('proto.TraceSession');
        // debugger
      } else {
        let parse = JSON.parse(payload)
        state.entire_command_buffer.length = 0
        state.entire_command_buffer = [...parse]

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
        let newTop = state.command_buffer[state.selected_index].cursor.line * 22 - 100
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
      // let direction = 'right'
      // if (new_index < old_index) {
      //   //  we are scrolling back
      //   direction = 'left'
      // }
      //
      // let attempt_index = payload
      //
      //
      //
      // while (true) {
      //   if (attempt_index <= 0 && attempt_index >= state.command_buffer.length - 1) {
      //     break
      //   }
      //   let command = state.command_buffer[attempt_index]
      //   if (state.ui.is_filtered(command)) {
      //     if (direction ==='right') {
      //       attempt_index++
      //     } else  if (direction ==='left') {
      //       attempt_index--
      //     }
      //     continue
      //   }
      //   break
      // }
      // console.table({old_index})

      state.selected_index = new_index
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
  },
  actions: {
    unignore_file (context: ActionContext, filename: string) {
      context.commit('did_unignore_file', filename)
      context.commit('update_filtered_events')
    },
    ignore_current_file (context: ActionContext) {
      let selected_event: CodeEvent = context.state.command_buffer[context.state.selected_index]
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

      }

      socket.on('disconnect', () => {
        context.commit('did_disconnect')
      })
      socket.on('reply', (data) => {
        context.commit('did_receive_buffer', data)
        context.commit('update_filtered_events')
        let files = new Set()

        context.state.command_buffer.forEach(value => {
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
    debug_next_line (context: ActionContext) {
      let x: MyState = context.state


      let attempt_index = context.state.selected_index + 1

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
      let selected_event: Command = state.command_buffer[state.selected_index]
      if (selected_event) {
        return state.files.find((value: CodeFile) => value.filename === selected_event.cursor.file)
      }
    },
    total_events: function (state: MyState) {
      if (!state.command_buffer) {
        return 0
      }

      // let counter = 0
      // if (state.ui.file_filters.length > 0) {
      //   state.command_buffer.forEach((_: Command) => {
      //     if (!state.ui.is_filtered(_)) {
      //       counter++
      //     }
      //   })
      //   return counter
      // }

      let length = state.command_buffer.length
      return length
    },

    total_events_unfiltered: function (state: MyState) {
      if (!state.command_buffer) {
        return 0
      }

      let length = state.command_buffer.length
      return length
    },
    selected_event: state => {
      return state.command_buffer[state.selected_index]
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
