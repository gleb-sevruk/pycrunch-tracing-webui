<template>
  <div class="bg-apple-gray-4 elevation-03 p-1 pl-4 d-flex my-toolbar">
    <el-button disabled size="small" icon="el-icon-caret-top" class="bg-apple-gray-2" title="Step Out"></el-button>
    <el-button @click="debug_previous_line" size="mini" icon="el-icon-caret-left" class="bg-apple-gray-2" title="Back"></el-button>
    <el-button @click="debug_next_line" size="mini" icon="el-icon-caret-right" class="bg-apple-gray-2" title="Forward"></el-button>
    <el-button  disabled size="mini" icon="el-icon-caret-bottom" class="bg-apple-gray-2" title="Step over"></el-button>
    <pc-time-slider></pc-time-slider>
    <el-button @click="ignore_current_file"  size="mini" icon="el-icon-view" class="bg-apple-gray-2" title="Ignore file"></el-button>
  </div>
</template>

<script>
  import PcTimeSlider from '../time-slider.component'
  import {mapActions, mapMutations} from 'vuex'
  export default {
    name: "pc-toolbar-surface",
    components: {PcTimeSlider},
    methods: {
      ...mapActions(['debug_previous_line', 'debug_next_line', 'ignore_current_file']),
      // ...mapMutations()
    },
  }
</script>

<style scoped>
  .my-toolbar {
    height: 2em;
  }
</style>