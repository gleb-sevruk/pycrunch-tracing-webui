<template>
  <div class="bg-apple-gray-4 elevation-03 p-1 pl-4 d-flex my-toolbar">
    <el-button  @click="step_out_backwards" size="small" icon="el-icon-arrow-up" class="bg-apple-gray-2" title="(Shift+↑) Step Out Back"></el-button>
    <el-button  @click="step_back_over" size="small" icon="el-icon-caret-top" class="bg-apple-gray-2" title="(↑) Step Over Back"></el-button>
    <el-button @click="debug_previous_line" size="mini" icon="el-icon-caret-left" class="bg-apple-gray-2" title="(←) Back"></el-button>
    <el-button @click="debug_next_line" size="mini" icon="el-icon-caret-right" class="bg-apple-gray-2" title="(→) Forward"></el-button>
    <el-button @click="step_over" size="mini" icon="el-icon-caret-bottom" class="bg-apple-gray-2" title="(↓) Step over"></el-button>
    <el-button  @click="step_out_forward" size="small" icon="el-icon-arrow-down" class="bg-apple-gray-2" title="(Shift+ ↓) Step Out Forward"></el-button>
    <pc-time-slider></pc-time-slider>
    <el-dropdown size="mini"
                 class="d-flex dropdown--ignore-file mr-1"
                 split-button
                 @visible-change="dropdown_visible = !dropdown_visible"
                 @click="ignore_current_file"
                 @command="handleCommand">
      Ignore File
      <el-dropdown-menu slot="dropdown">
        <template v-if="dropdown_visible">
          <el-dropdown-item :command="s" v-for="s in ignore_suggestions" :key="s">{{s}}</el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </el-dropdown>
<!--    <el-button @click="ignore_current_file"  size="mini" icon="el-icon-view" class="bg-apple-gray-2" title="Ignore file"></el-button>-->
  </div>
</template>

<script>
  import PcTimeSlider from '../time-slider.component'
  import {mapActions, mapGetters, mapMutations} from 'vuex'
  export default {
    name: "pc-toolbar-surface",
    data () {
      return {
        dropdown_visible: false
      }
    },
    components: {PcTimeSlider},
    methods: {
      ...mapActions([
        'debug_previous_line',
        'debug_next_line',
        'ignore_current_file',
        'ignore_folder',
        'step_over',
        'step_back_over',
        'step_out_backwards',
        'step_out_forward',
      ]),
      handleCommand(command) {
        this.ignore_folder(command)
      }
      // ...mapMutations()
    },
    computed: {
      ...mapGetters(['ignore_suggestions']),
    },
  }
</script>

<style scoped>
  .my-toolbar {
    height: 2em;
  }
  .dropdown--ignore-file {
    min-width: 9em;
  }
</style>