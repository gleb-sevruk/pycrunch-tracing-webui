// @flow
<template>
  <div class="home elevation-02" v-hotkey.stop="keymap">
    <div class="side-by-side d-flex flex-row">
      <pc-left-sidebar v-if="is_panel_visible('main.sidebar')"></pc-left-sidebar>
      <div class="right-content w-100">
        <div class="widgets-container sticky-top">
          <pc-toolbar-surface v-if="is_panel_visible('toolbar.surface')"></pc-toolbar-surface>
          <pc-status-bar v-if="is_panel_visible('main.filename')"/>
        </div>
        <pc-tabbed-editor></pc-tabbed-editor>
        <pc-stack-frames v-if="is_panel_visible('main.stack-frames')"/>
        <pc-ignored-files v-if="is_panel_visible('main.ignored_files')"></pc-ignored-files>
      </div>
    </div>
    <el-dialog
        :show-close="false"
        class="please-wait__loading-recording"
        :visible.sync="loading_shared_modal_visible"
        :close-on-click-modal="false"
        :close-on-press-escape="false"

        title="Loading shared recording...">
      Please wait while recording is being downloaded...
      <el-progress class="faster-transition" :percentage="progress.percentage"></el-progress>

      <div class="mt-2">
        <span class="mx-3">{{ debounced_current_percentage | round(2) }}%</span>
        <span class="text-secondary">{{ debounced_current_progress | humansize }} of {{
            progress.target | humansize
          }}</span>
      </div>
      <el-button class="mt-2" type="warning" @click="cancelRecordingLoading">Cancel download</el-button>

      <div class="mt-4">Or <a :href="progress.href" target="_blank">download file via direct link</a> to analyze recording offline</div>
    </el-dialog>
  </div>
</template>

<script>
  // @ is an alias to /src
  import {mapState, mapActions, mapGetters, mapMutations} from 'vuex'
  import PcTabbedEditor from './code/tabbed-editor.component'
  import PcClientConnections from './widgets/client-connections.component'
  import PcStatusBar from './code/top-status-bar.component'
  import PcToolbarSurface from './toolbars/toolbar-surface.component'
  import PcLeftSidebar from './left-sidebar/left.sidebar.component'
  import PcIgnoredFiles from './ignored-files.component'
  import PcStackFrames from './webgl-graph/PcStackFrames'
  import {EventBus} from '../shared/event-bus'
  import axios from 'axios'
  import { API_ROOT } from '@/config'
  import { loaderServiceOptions } from '@/shared/preloader'

  const browserTitle = 'PyCrunch Tracing'

  export default {
    name: 'Home',
    metaInfo () {
      // DO NOT Move this inside arrow function, as reactive updates will not work
      let session_name = null
      if (this.current_session) {
        session_name = this.current_session.name
      }
      return {
        titleTemplate: () => {
          return session_name ? `${session_name} | ${browserTitle}` : browserTitle
        },
      }
    },
    components: {
      PcStackFrames,
      PcIgnoredFiles,
      PcToolbarSurface,
      PcTabbedEditor,
      PcLeftSidebar,
      PcStatusBar,
    },
    data () {
      return {
        slider_position: 1,
        loading_shared_modal_visible: false,
        progress: {
          current: 0,
          target: 0,
          percentage: 0,
          in_transit: false,
          cancellation_token: null,
        },
      }
    },
    mounted (): void {
      EventBus.$on('trace_load_will_fail', payload => {
        this.$notify.error("Failed to load trace " + payload)
      });
      this.arrow_keys_will_become_disabled()
      let rq = this.$route.query
      if (rq.open) {
        // if (rq.open === 'v0.1-interactive-demo') {
        this.open_remote_recording(rq.open)
        // }
      }
      if (rq.shared) {
        console.log('openRecordingBySharingId', rq.shared)
        this.openPublicRecordingBySharingId(rq.shared)
      }
    },
    methods: {
      ...mapActions([
        'set_selected_index',
        'debug_previous_line',
        'debug_next_line',
        'step_over',
        'step_back_over',
        'step_back_out',
        'step_out_backwards',
        'step_out_forward',
        'will_open_local_trace',
        'open_remote_recording',
        'open_trace_from_array_buffer',
      ]),
      ...mapMutations(['selected_index_will_change','will_toggle_ui_panel', 'toggle_ui_follow_cursor']),
      cancelRecordingLoading () {
        this.progress.cancellation_token.cancel()

      },
      async getRecordingOneTimeLink (sharingToken) {
        return await axios.post(`${API_ROOT}/recordings/by-token/${sharingToken}/generate-download-url`)
      },
      async openPublicRecordingBySharingId (sharingToken) {
        // TODO: some sort of duplication can be removed, similar logic in cloud-recording.table
        this.loading_shared_modal_visible = true
        this.progress.in_transit = true
        this.progress.current = 0
        this.progress.percentage = 0

        this.progress.target = 100
        try {
          let x = await this.getRecordingOneTimeLink(sharingToken)
          if (!x.data.href) {
            console.warn('Cannot get a link for recording')
            return
          }
          let s3_link = x.data.href
          this.progress.href = s3_link

          const cancelTokenSource = axios.CancelToken.source()
          this.progress.cancellation_token = cancelTokenSource

          let response = await
              axios.get(
                  s3_link,
                  {
                    responseType: 'arraybuffer',
                    onDownloadProgress: (evt: ProgressEvent) => {
                      this.$nextTick(() => {
                        this.progress.current = evt.loaded
                        this.progress.target = evt.total
                        this.progress.percentage = Math.round((evt.loaded / evt.total) * 100)
                      })
                    },

                    cancelToken: cancelTokenSource.token,
                  },
              )
          const loading = this.$loading(loaderServiceOptions);
          this.loading_shared_modal_visible = false
          setTimeout(async () => {
            this.open_trace_from_array_buffer(response.data)
            this.progress.in_transit = false
            loading.close()

          }, 170)

        } catch (error) {
          if(!axios.isCancel(error)) {
            this.$notify.error(`Failed to open recording. Check console logs for more details`)
            console.error('Failed to open recording', error)
          }
          this.loading_shared_modal_visible = false
          this.progress.in_transit = false
        }
      },
      buttonWillClick () {
      },

      arrow_keys_will_become_disabled () {
        Mousetrap.bind(['down', 'up'], function() {
          return false
        });
      }
    },
    computed: {
      ...mapGetters(['total_events','is_panel_visible']),
      ...mapState(['x', 'current_session', 'selected_event',  'is_connected']),
      debounced_current_progress () {
        return this.progress.current
      },
      debounced_current_percentage () {
        return this.progress.percentage
      },
      keymap () {
        return {
          'left': this.debug_previous_line,
          'right': this.debug_next_line,
          'up': this.step_back_over,
          'shift+up': this.step_out_backwards,
          'shift+down': this.step_out_forward,
          'down': this.step_over,
          'g' : () => this.will_toggle_ui_panel('main.stack-frames'),
          'shift+g' : () => this.will_toggle_ui_panel('stack-graph.tooltip'),
          'shift+s' : () => this.will_toggle_ui_panel('main.sidebar'),
          'shift+i' : () => this.will_toggle_ui_panel('main.ignored_files'),
          'shift+o' : () => EventBus.$emit('user_will_open_file', {}),
          's' : () => this.will_toggle_ui_panel('inspector.stack'),
          'i' : () => this.will_toggle_ui_panel('widgets.inspector'),
          'v' : () => this.will_toggle_ui_panel('inspector.variables'),
          'f' : () => this.toggle_ui_follow_cursor(),
          'r': () => this.will_toggle_ui_panel('stack-graph.render_stats'),

        }
      }
    },

  }
</script>
<style scoped>

  .canvas__container {
    width: 100%;
    height: 60vh;
    display: block;
  }
</style>

<style>
.please-wait__loading-recording .el-progress-bar__inner {
  /*transition: none !important;*/
  transition: width 0.156s ease !important;
}
</style>