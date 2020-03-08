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
        <div ref="myCanvasContainer" class="canvas__container js-canvas__container">
          <!--      <canvas ref="myCanvas" class="js-canvas" width="700" height="400"></canvas>-->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  // @ is an alias to /src
  import HelloWorld from '@/components/HelloWorld.vue'
  import {mapState, mapActions, mapGetters, mapMutations} from 'vuex'
  import PcCodeViewer from './code/code-viewer.component'
  import PcTabbedEditor from './code/tabbed-editor.component'
  import PcClientConnections from './widgets/client-connections.component'
  import PcStatusBar from './code/top-status-bar.component'
  import PcToolbarSurface from './toolbars/toolbar-surface.component'
  import PcLeftSidebar from './left-sidebar/left.sidebar.component'
  import PcIgnoredFiles from './ignored-files.component'
  import PcStackFrames from './PcStackFrames'


  export default {
    name: 'Home',
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
        slider_position: 1
      }
    },
    mounted (): void {
      this.connect()

      this.arrow_keys_will_become_disabled()
    },
    methods: {
      ...mapActions([
        'connect', 'load_command_buffer',
        'set_selected_index',
        'debug_previous_line',
        'debug_next_line',
        'step_over',
        'step_back_over',
        'step_back_out',
        'step_out_backwards',
        'step_out_forward',
      ]),
      ...mapMutations(['selected_index_will_change','will_toggle_ui_panel']),

      buttonWillClick () {
        this.load_command_buffer()
      },

      arrow_keys_will_become_disabled () {
        Mousetrap.bind(['down', 'up'], function() {
          return false
        });
      }
    },
    computed: {
      ...mapGetters(['total_events','is_panel_visible']),
      ...mapState(['x', 'selected_event',  'is_connected']),
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