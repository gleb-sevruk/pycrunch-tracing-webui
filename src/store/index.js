// @flow
import Vue from 'vue'
import Vuex, {ActionContext} from 'vuex'
import {parents, short} from '../views/code/short-filename'
import { FileWithId } from './protobuf_message_parsing'
import {CodeEvent, CodeFile, ProfileDetails, TracingSession, UiState} from './models'
import global_state from './global_state'
import {seek_back_in_current_method, seek_step_out_backwards,
  seek_step_out_forward, step_over_from_current_event} from './debugging-steper'
import {EventBus} from '../shared/event-bus'
import { read_binary_file } from '../binary-format/parsing'

import axios from 'axios'
import { track } from '@/shared/ga-events'
import moduleCloud from './cloud.module'
import { Loading } from 'element-ui';
import { loaderServiceOptions } from '@/shared/preloader'

Vue.use(Vuex)

class MyState {
  current_session: TracingSession = null
  selected_file: CodeFile
  file_refs: Array<FileWithId> = []
  files: Array<CodeFile> = []
  selected_index: number = 0
  selected_event: CodeEvent = null
  ui: UiState = new UiState()
  total_events: number = 0
  profile_details: ProfileDetails = null
}

function getState (): MyState {
  return new MyState()
}

// let url = 'http://192.168.1.174:8080'
// url = 'http://127.0.0.1:8080'
// let socket = io(url)
export default new Vuex.Store({
  modules: {
    cloud: moduleCloud
  },
  state: getState(),
  mutations: {
    session_metadata_did_load(state: MyState, metadata: TracingSession) {
      state.current_session = metadata
    },
    did_unignore_file (state: MyState, filename: string) {
      state.ui.unignore_file(filename)
    },
    did_unignore_folder (state: MyState, folder: string) {
      state.ui.unignore_folder(folder)
    },
    did_ignore_file (state: MyState, filename: string) {
      state.ui.ignore_file(filename)
    },
    did_ignore_folder (state: MyState, folder: string) {
      state.ui.ignore_folder(folder)
    },
    update_filtered_events (state: MyState, payload) {
      global_state.command_buffer.length = 0
      let back_buffer = []
      global_state.entire_command_buffer.forEach(_ => {
        if (!state.ui.is_filtered(_)) {
          back_buffer.push(_)
        }
      })
      global_state.command_buffer = back_buffer
      state.total_events = global_state.command_buffer.length
      EventBus.$emit('display_events_did_update', state.total_events)

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
        // console.group('scroll decision')
        let selectedEvent = state.selected_event
        if (!selectedEvent) {
          return
        }

        let selector = 'a[name=line' + selectedEvent.cursor.line +"]"
        let x = window.top.document.querySelectorAll(selector)
        if (x.length <= 0 ) {
        //  todo retry
        //  no such element
          return
        }

        let line_element = x[0]
        let newTop = line_element.offsetTop - 100
        // console.log(x)


        let scrollTop = window.scrollY
        let up_treshold = scrollTop - 100
        if (up_treshold < 0) {
          up_treshold = 0
        }

        let down_treshold = scrollTop + 200
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

        // console.groupEnd()
      }

      let old_index = state.selected_index
      let new_index = payload

      state.selected_index = new_index
      state.selected_event = global_state.command_buffer[new_index]

      follow_cursor_if_enabled(state)
    },
    will_toggle_ui_panel (state: MyState, panel_name: string) {

      state.ui.toggle_panel(panel_name)
    },
    toggle_ui_follow_cursor (state: MyState, payload) {
      state.ui.follow_cursor = !state.ui.follow_cursor
    },
    add_new_ignore_rule (state: MyState, payload: Array<any>) {
      state.profile_details.exclusions.push(payload)
    },
    remove_ignore_rule (state: MyState, payload: string) {
      let indexOf = state.profile_details.exclusions.indexOf(payload)
      if (indexOf >= 0) {
        state.profile_details.exclusions.splice(indexOf, 1)
      }
    },
  },
  actions: {
    open_trace_from_array_buffer(context: ActionContext, buffer: any) {
      // let buffer : ArrayBuffer = e.target.result
      read_binary_file(context, 'open_trace_from_array_buffer', buffer)
    },
    open_local_trace_from_file(context: ActionContext, file: any) {
      let loadingInstance = Loading.service(loaderServiceOptions);

      let name = file.name
      const reader = new FileReader();
      reader.onload = (e: any) => {
        let buffer : ArrayBuffer = e.target.result
        try {

        }
        finally {
          loadingInstance.close();
        }
        read_binary_file(context, name, buffer)
      };

      reader.readAsArrayBuffer(file);
    },
    async will_drag_drop_local_trace(context: ActionContext, native_event: any) {

      const file = native_event.dataTransfer.files[0]
      track('open', 'will_drag_drop_local_trace', file.name)
      await context.dispatch('open_local_trace_from_file', file)
    },
    async will_open_local_trace(context: ActionContext, native_event: any) {
      const file = native_event.target.files[0];
      track('open', 'will_open_local_trace', file.name)
      await context.dispatch('open_local_trace_from_file', file)
    },
    async open_remote_recording(context: ActionContext, recording_name: any) {
      track('open', 'open_remote_recording', recording_name)
      let x = await axios.get(recording_name + ".pycrunch-trace",
        {responseType: 'arraybuffer'})
      read_binary_file(context, recording_name, x.data)
    },
    unignore_file (context: ActionContext, filename: string) {
      context.commit('did_unignore_file', filename)
      context.commit('update_filtered_events')
    },
    unignore_folder (context: ActionContext, folder: string) {
      context.commit('did_unignore_folder', folder)
      context.commit('update_filtered_events')
    },
    ignore_current_file (context: ActionContext) {
      let selected_event: CodeEvent = context.state.selected_event
      context.commit('did_ignore_file', selected_event.cursor.file)
      context.commit('update_filtered_events')
    },
    ignore_folder (context: ActionContext, payload: string) {
      context.commit('did_ignore_folder', payload)
      context.commit('update_filtered_events')
    },
    debug_next_line (context: ActionContext) {
      let attempt_index = context.state.selected_index + 1
      context.commit('selected_index_will_change', attempt_index)
    },

    step_back_over (context: ActionContext) {
      let x: MyState = context.state
      let attempt_index = context.state.selected_index - 1

      let evt: CodeEvent = global_state.command_buffer[attempt_index]
      // seek backward
      attempt_index = seek_back_in_current_method(evt, attempt_index)
      context.commit('selected_index_will_change', attempt_index)

    },
    step_out_backwards (context: ActionContext) {

      let event_under_cursor: CodeEvent = global_state.command_buffer[context.state.selected_index]
      // same as step out in regular debugging session, but
      // in opposite direction

      let attempt_index = seek_step_out_backwards(event_under_cursor, context.state.selected_index)
      context.commit('selected_index_will_change', attempt_index)

    },
    step_out_forward (context: ActionContext) {

      let current_index = context.state.selected_index

      let current_event: CodeEvent = global_state.command_buffer[current_index]
      // this is same as step out in regular debugging session
      let new_index = seek_step_out_forward(current_event, current_index)
      context.commit('selected_index_will_change', new_index)

    },

    step_over (context: ActionContext) {
      let x: MyState = context.state
      let attempt_index = context.state.selected_index + 1

      let evt: CodeEvent = global_state.command_buffer[attempt_index]
      attempt_index = step_over_from_current_event(evt, attempt_index)
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
    short_filename: state => (full: string, until: number) => {
      if (typeof(full) === 'number') {
        return short(global_state.file_at(full), until)
      }
      return short(full, until)
    },
    file_from_id: state => (file_id: number) => {
      let found = global_state.file_at(file_id)
      if (found) {
        return found
      }
    },
    ignore_suggestions:  (state: MyState) => {
      let selected_event = state.selected_event
      if (selected_event) {
        let file_id = selected_event.cursor.file
        let found = global_state.file_at(file_id)
        if (found) {
          let result = parents(found, 5)
          return result
        }
      }
    },

    selected_file: (state: MyState) => {
      let selected_event = state.selected_event
      if (selected_event) {
        let fileref = global_state.file_at(selected_event.cursor.file)
        return state.files.find((value: CodeFile) => value.filename === fileref)
      }
    },


  },

  strict: true,
})
