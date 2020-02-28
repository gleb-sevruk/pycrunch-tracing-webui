<template>
  <div class="left-sidebar overflow-hidden vh-100 elevation-02">
    <div class="text-light">Sessions</div>
    <div v-for="session in tracing_sessions" class="single-session m-1 p-2 elevation-03 m-4 mb-4">

      <div class="text-center" >
        <div class="text-wrap">{{session.short_name}}</div>
        <div class="mt-2 mb-n1 small">{{session.file_size_on_disk}}</div>
        <hr>
        <div class="text-left"><span class="pr-2"> Events:</span> <code> {{session.events_in_session}}</code> </div>
        <el-button class="text-center" @click="load_session(session.short_name)">Load</el-button>
      </div>
    </div>

  </div>
</template>

<script>
  import {mapActions, mapState} from 'vuex'

  export default {
    name: "pc-left-sidebar",
    computed: {
      ...mapState(['tracing_sessions']),
    },
    methods: {
      ...mapActions(['load_session']),

    },
  }
</script>

<style scoped>
  .left-sidebar {
    width: 290px;
    /*max-width: 240px;*/
    height: 100%;
  }
</style>