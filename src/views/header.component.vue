<template>
  <div id="nav" class="elevation-03 p-2 d-flex justify-content-between">
    <div>
      <el-button size="mini" icon="el-icon-more" class="mr-4" @click="will_toggle_ui_panel('main.sidebar')"></el-button>

      <pc-connection-status/>
    </div>
    <pc-client-connections></pc-client-connections>
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
          <div>
            <el-checkbox v-model="is_filename_panel_visible">Top panel</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_inspector_panel_visible">Inspector</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_sidebar_panel_visible">Side Bar</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_ignored_files_panel_visible">Ignored Files</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_stack_graph_panel_visible">Graph Canvas</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_variables_panel_visible">Variables</el-checkbox>
          </div>
          <div>
            <el-checkbox v-model="is_stack_visible">Stack</el-checkbox>
          </div>

          <div>UI</div>
          <div>
            <el-checkbox v-model="follow_cursor">Follow Cursor</el-checkbox>
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
      is_inspector_panel_visible:  autoGets('widgets.inspector'),


    },
    methods: {
      ...mapMutations(['will_toggle_ui_panel', 'toggle_ui_follow_cursor'])
    },
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