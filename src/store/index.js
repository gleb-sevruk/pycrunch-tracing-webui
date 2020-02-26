// @flow

import Vue from 'vue'
import Vuex, {ActionContext} from 'vuex'
import io from 'socket.io-client'
import {short} from '../views/code/short-filename'

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

class Command {
  cursor: ExecutionCursor
}

class CodeFile {
  filename: string
  contents: string
}

class CodeEvent {
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

class MyState {
  x: string = '11'
  is_connected: boolean = false
  selected_file: CodeFile
  command_buffer: Array<Command> = []
  files: Array<CodeFile> = []
  active_trackers: Array<LiveTracker> = []
  selected_index: number = 0
  selected_event: CodeEvent
  ui: UiState = new UiState()
}

function getState (): MyState {
  return new MyState()
}

let socket = io('http://0.0.0.0:8080')

export default new Vuex.Store({
  state: getState(),
  mutations: {
    did_connect (state: MyState) {
      state.is_connected = true
    },
    did_disconnect (state: MyState) {
      state.is_connected = false
    },
    new_tracker_did_connect (state: MyState, data) {
      state.active_trackers.push(new LiveTracker(data.sid, data.version))
    },
    did_receive_buffer (state: MyState, payload) {
      let parse = JSON.parse(payload)
      let x = typeof parse
      console.log(parse)
      state.command_buffer.length = 0
      state.command_buffer = [...parse]
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
      state.selected_index = payload
    },
    will_toggle_ui_panel (state: MyState, panel_name: string) {
      state.ui.toggle_panel(panel_name)
    },
  },
  actions: {
    load_file (context: ActionContext, payload) {
      socket.emit('event', {
        action: 'load_file',
        file_to_load: payload.file,
      })
    },
    async connect (context: ActionContext) {
      socket.on('connect', on_connect)

      async function on_connect () {
        context.commit('did_connect')
        console.log(socket.connected) // true
        context.dispatch('load_command_buffer')

      }

      socket.on('disconnect', () => {
        context.commit('did_disconnect')
      })
      socket.on('reply', (data) => {
        context.commit('did_receive_buffer', data)
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

      socket.on('front', (data) => {
        // console.group('front event')
        // console.table(data)
        // console.groupEnd()
        if (data.event_name) {
          let e = data.event_name
          if (e === 'new_tracker') {
            context.commit('new_tracker_did_connect', data)


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
    debug_next_line (context: ActionContext) {
      context.commit('selected_index_will_change', context.state.selected_index + 1)
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
      return state.command_buffer.length
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
