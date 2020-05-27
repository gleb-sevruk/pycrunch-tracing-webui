<template>
  <div class="left-sidebar overflow-hidden h-100 elevation-02">
    <div class="text-light text-secondary p-2">Session Details</div>
<!--    <div>Live</div>-->
<!--    <div v-for='live in active_trackers' class="live-session d-flex flex-nowrap text-nowrap overflow-hidden bg-apple-gray-2">-->
<!--      {{live.version}}: {{live.sid}}-->
<!--    </div>-->
    <div v-if="current_session" class="single-session m-1  elevation-01 m-4 mb-4">
        <div class="text-wrap">{{current_session.name}}</div>
        <div class="mt-2 mb-n1 small " >{{current_session.file_size_on_disk}}</div>
<!--        <hr>-->
        <div class="text-left">
           <code style="color: #9b7b73;"> {{current_session.events_in_session}}</code><span class="pl-1 small text-secondary"> Events</span> </div>
<!--        <el-button class="text-center" @click="load_session(session.short_name)">Load</el-button>-->
    </div>
    <div v-if="!current_session" class="single-session m-1 p-2 m-4 mb-4">
     <span>No session loaded. </span>
    </div>
  </div>
</template>

<script>
  import {mapActions, mapState} from 'vuex'

  export default {
    name: "pc-left-sidebar",
    computed: {
      ...mapState(['current_session']),
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