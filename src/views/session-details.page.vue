<template>
  <div class="about elevation-02 min-vh-100 p-3 pl-5">
    <h1>Session Details</h1>
<!--    <div>{{current_session}}</div>-->
    <div>{{current_session.name}}</div>
    <div class="small">{{current_session.events_in_session}} Events</div>
    <div class="small text-secondary">{{current_session.name}}</div>
    <div class="small text-secondary">{{current_session.file_size_on_disk}}</div>


    <h6 class="mt-5">Included Files</h6>
    <div class="small text-secondary">Files included in recording</div>
    <div v-for="file in current_session.files_in_session">{{file}}</div>

    <h6 class="mt-5">Excluded Files</h6>
    <div class="small text-secondary">Files ignored during tracing</div>
    <div v-for="file in current_session.excluded_files">{{file}}</div>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'

  export default {
    name: 'pc-page-session-details',
    data () {
      return {
        slider_position: 1
      }
    },
    computed: {
      ...mapState(['current_session']),
      ...mapGetters(['total_events', 'total_events_unfiltered'])
    },
    methods: {
      ...mapMutations(['selected_index_will_change']),

    },
  }
</script>
<style scoped>
  .slider-dock {
    display: inline-block;
    width: 100%;
  }
</style>
