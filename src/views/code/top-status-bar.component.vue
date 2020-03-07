<template>
  <div v-if="selected_file" class="text-secondary small sticky-top bg-apple-gray-5 " >event {{selected_index + 1}} of
    {{total_events}} in {{selected_file.filename}}
  </div>
</template>
<script>
  import {mapGetters, mapState} from 'vuex'

  export default {
    name: 'pc-status-bar',

    computed: {
      ...mapState(['selected_index', 'selected_event','total_events']),
      ...mapGetters(['short_filename', 'selected_file', 'is_panel_visible']),
    },
  }
</script>
