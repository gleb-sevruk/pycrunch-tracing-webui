// @flow
<template>
  <div class="home elevation-02" v-hotkey="keymap">
    <div class="side-by-side d-flex flex-row">
      <pc-left-sidebar v-if="is_panel_visible('main.sidebar')"></pc-left-sidebar>
      <div class="right-content w-100">
        <div class="widgets-container sticky-top">
          <pc-toolbar-surface v-if="is_panel_visible('toolbar.surface')"></pc-toolbar-surface>
          <pc-status-bar v-if="is_panel_visible('main.filename')"/>
        </div>
        <pc-tabbed-editor></pc-tabbed-editor>
        <div class="bg-apple-gray-2 fixed-bottom">
          Ignored files
          <pc-ignored-files></pc-ignored-files>
        </div>
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
  import PcLeftSidebar from './left-sidebar/right.sidebar.component'
  import PcIgnoredFiles from './ignored-files.component'


  export default {
    name: 'Home',
    components: {
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
    },
    methods: {
      ...mapActions(['connect', 'load_command_buffer', 'set_selected_index', 'debug_previous_line', 'debug_next_line']),
      ...mapMutations(['selected_index_will_change']),
      buttonWillClick () {
        this.load_command_buffer()
      },


    },
    computed: {
      ...mapGetters(['total_events', 'selected_event', 'is_panel_visible']),
      ...mapState(['x', 'is_connected']),
      keymap () {
        return {
          'left': this.debug_previous_line,
          'right': this.debug_next_line,

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