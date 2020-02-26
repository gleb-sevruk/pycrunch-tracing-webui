<template>
  <div id="nav" class="elevation-03 p-2 d-flex justify-content-between">
    <pc-connection-status/>
<!--    <pc-client-connections></pc-client-connections>-->
<!--    <router-link to="/">Tracing</router-link>-->
<!--    |-->
    <div>Tracing</div>
<!--    <router-link to="/about">-->
<!--      link-->
<!--    </router-link>-->

    <el-popover
          placement="bottom"
          title="Widgets"
          width="200"
          trigger="click"
          >
      <div>
        <div>
        <el-checkbox v-model="is_filename_panel_visible">Top panel</el-checkbox>
        </div>
        <div>
        <el-checkbox v-model="is_inspector_panel_visible">Inspector</el-checkbox>
        </div>
      </div>
        <el-button size="mini" slot="reference" icon="el-icon-setting"></el-button>
      </el-popover>


  </div>

</template>

<script>
  import PcConnectionStatus from './connection-status.component'
  import {mapActions, mapGetters, mapMutations} from 'vuex'
  export default {
    name: "pc-header",
    components: {PcConnectionStatus},
    computed: {

      ...mapGetters(['is_panel_visible']),
      is_filename_panel_visible: {
        get () {
          return this.is_panel_visible('main.filename')
        },
        set (value) {
          this.will_toggle_ui_panel('main.filename')

        }


      },
      is_inspector_panel_visible : {
        get () {
          return this.is_panel_visible('widgets.inspector')
        },
        set (value) {
          this.will_toggle_ui_panel('widgets.inspector')

        }
      }


    },
    methods: {
      ...mapMutations(['will_toggle_ui_panel'])
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