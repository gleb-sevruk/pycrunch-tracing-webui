<template>
    <div class="trackers">
      x
      <div v-for="t in active_trackers" class="single-tracker small text-secondary">
        [{{t.version}}]{{t.sid}}
      </div>
    </div>
</template>

<script>
  // not used
  import {mapState} from 'vuex'

  export default {
    name: "pc-client-connections",
    computed: {
      ...mapState(['active_trackers'])
    },

  }
</script>

<style scoped>

</style>