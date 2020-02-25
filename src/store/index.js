// @flow

import Vue from 'vue'
import Vuex, {ActionContext} from 'vuex'
import io from 'socket.io-client';
import {short} from '../views/code/short-filename'

Vue.use(Vuex)

Array.prototype.filterInPlace = function(condition, thisArg) {
  let j = 0;

  this.forEach((el, index) => {
    if (condition.call(thisArg, el, index, this)) {
      if (index !== j) {
        this[j] = el;
      }
      j++;
    }
  })

  this.length = j;
  return this;
}

class Command {
}

class CodeFile {
  filename: string
  contents: string
}

class MyState {
  x: string = '11'
  is_connected: boolean = false
  selected_file: CodeFile
  command_buffer: Array<Command> = []
  files: Array<CodeFile> = []
}
function getState () : MyState {
  return new MyState()
}

let socket = io('http://0.0.0.0:8080')


export default new Vuex.Store({
  state: getState(),
  mutations: {
    did_connect (state : MyState) {
      state.is_connected = true
    },
    did_disconnect (state : MyState) {
      state.is_connected = false
    },
    did_receive_buffer (state: MyState, payload){
      let parse = JSON.parse(payload)
      let x = typeof parse
      console.log(parse)
      state.command_buffer.length = 0
      state.command_buffer = [...parse]
    },
    file_did_load(state: MyState, payload) {
      let x = new CodeFile()
      x.filename =  payload.filename
      x.contents =  payload.contents
      state.files.filterInPlace(function (_: CodeFile) {
        return _.filename !== x.filename
      });

      state.files.push(x)
    },
    selected_file_will_change(state: MyState, payload) {
      state.selected_file = state.files[0]
    },
  },
  actions: {
    load_file (context : ActionContext, payload) {
      socket.emit('event', {action: 'load_file', file_to_load: payload.file})
    },
    async connect(context : ActionContext) {
      socket.on('connect', on_connect);

      async function on_connect () {
        context.commit('did_connect')
        console.log(socket.connected) // true
        context.dispatch('load_command_buffer')

      }

      socket.on('disconnect', () => {
        context.commit('did_disconnect')
      });
      socket.on('reply', (data) => {
        context.commit('did_receive_buffer', data)
        let files = new Set();

        context.state.command_buffer.forEach(value => {
          if (value.cursor){
            files.add(value.cursor.file)
          }
        })

        files.forEach(_ => context.dispatch('load_file', {file: _}))

      });
      socket.on('file_did_load', (data) => {
        context.commit('file_did_load', data)
        context.commit('selected_file_will_change')
      });
      // // socket.connect()
      // socket.emit('event', {data:1})

    },
    load_command_buffer(context : ActionContext) {
      socket.emit('event', {
        action: 'load_buffer'
      })
    },
  },
  getters: {
    short_filename: state => full => {
      return short(full)
    },
    selected_file: state => {
      return state.files[0]
    }
  },
  modules: {
    // code_editor: {
    //   state: {
    //     selected_file: null
    //   }
    // },
  },
})
