<template>
  <div class="elevation-03  fixed-bottom">
    Ignored files

    <div class="files">
    <div v-for="file in ui.file_filters"><el-button @click="unignore_file(file)">{{file}}</el-button></div>
  </div>
  </div>
</template>

<script>
  import {mapActions, mapMutations, mapState} from 'vuex'

  export default {
    name: "pc-ignored-files",
    computed: {
      ...mapState(['ui'])
    },
    methods: {
      ...mapActions(['unignore_file'])

    },
  }
</script>

<style scoped>

</style>