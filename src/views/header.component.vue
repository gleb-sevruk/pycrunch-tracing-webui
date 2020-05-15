<template>
  <div id="nav" class="elevation-03 p-2 d-flex justify-content-between">
    <div>
      <el-button size="mini" title="Toggle Sidebar (Shift+s)" icon="el-icon-more" class="mr-2" @click="will_toggle_ui_panel('main.sidebar')"></el-button>
      <el-button size="mini" title="Open Local File (Shift+o)" icon="el-icon-upload" class="mr-4" @click="did_click_on_file_selection"></el-button>
      <input ref="trace_file_input" type="file" @change="will_open_local_trace($event)" v-show="false"></input>
      <pc-connection-status/>
    </div>
    <router-link to="/">Tracing</router-link>
    <router-link to="/session-details">
      Session Details
    </router-link>
    <router-link to="/configuration">
      Configuration
    </router-link>
    <div class="right-buttons">


      <el-popover
          placement="bottom"
          title="Settings"
          width="200"
          trigger="click"
      >
        <div>
          <div>Widgets</div>
<!--          todo maybe use v-for widgets?-->
          <div>
            <el-checkbox v-model="is_filename_panel_visible">Top panel</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_inspector_panel_visible">(i) Inspector</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_sidebar_panel_visible">(Shift+s) Side Bar</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_ignored_files_panel_visible">(Shift+i) Ignored Files</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_stack_graph_panel_visible">(g) Graph Canvas</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_stack_graph_tooltip_visible">(Shift+g) Graph Mouse Tooltip</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_graph_render_stats_visible">(r) Graph Render Stats</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_variables_panel_visible">(v) Variables</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_stack_visible">(s) Stack</el-checkbox>
          </div>

          <div>UI</div>
          <div>
            <el-checkbox v-model="follow_cursor">(f) Follow Cursor</el-checkbox>
          </div>

        </div>
        <el-button size="mini" slot="reference" icon="el-icon-setting"></el-button>
      </el-popover>


    </div>

  </div>

</template>

<script>
  import PcConnectionStatus from '../components/connection-status.component'
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'
  import {EventBus} from '../shared/event-bus'

  function autoGets (panel_name) {
    return {
      get () {
        return this.is_panel_visible(panel_name)
      },
      set (value) {
        this.will_toggle_ui_panel(panel_name)

      },
    }
  }
  export default {
    name: "pc-header",
    components: {PcConnectionStatus},
    computed: {

      ...mapState(['tracing_sessions', 'ui']),
      ...mapGetters(['is_panel_visible']),
      is_filename_panel_visible: autoGets('main.filename'),
      is_variables_panel_visible: autoGets('inspector.variables'),
      is_stack_visible:autoGets('inspector.stack'),
      is_ignored_files_panel_visible:autoGets('main.ignored_files'),
      follow_cursor: {
        get () {
          return this.ui.follow_cursor
        },
        set () {
          this.toggle_ui_follow_cursor()
        },
      },
      is_sidebar_panel_visible: autoGets('main.sidebar'),
      is_stack_graph_panel_visible: autoGets('main.stack-frames'),
      is_stack_graph_tooltip_visible: autoGets('stack-graph.tooltip'),
      is_inspector_panel_visible:  autoGets('widgets.inspector'),
      is_graph_render_stats_visible: autoGets('stack-graph.render_stats'),

    },
    methods: {
      ...mapMutations(['will_toggle_ui_panel', 'toggle_ui_follow_cursor']),
      ...mapActions(['will_open_local_trace']),
      did_click_on_file_selection() {
        this.$refs.trace_file_input.click()
      },
    },
    mounted (): void {
      EventBus.$on('user_will_open_file', payload => {
        this.did_click_on_file_selection()
      });
    }
  }
</script>

<style lang="scss">
  @import "../styles/colors";

  .setting-icon {
    color: $color-apple-gray-text;
  }

  #nav {
    a {
      font-weight: bold;
      color: #2c3e50;

      &.router-link-exact-active {
        color: #42b983;
      }
    }
  }
</style>