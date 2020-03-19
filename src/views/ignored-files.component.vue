<template>
  <div class="elevation-03  fixed-bottom">
    Ignored files

    <div class="files">
    <div v-for="folder in ui.folder_filters"><el-button @click="unignore_folder(folder)">(directory) {{folder}}</el-button></div>
    <div v-for="file_id in ui.file_filters"><el-button @click="unignore_file(file_id)">{{file_from_id(file_id)}}</el-button></div>
  </div>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'

  export default {
    name: "pc-ignored-files",
    computed: {
      ...mapState(['ui']),
      ...mapGetters(['file_from_id']),
    },
    methods: {
      ...mapActions([
        'unignore_file',
        'unignore_folder',
      ])

    },
  }
</script>

<style scoped>

</style>