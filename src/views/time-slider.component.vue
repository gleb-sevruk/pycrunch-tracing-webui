<template>
  <div class="slider-dock mx-4">
    <el-slider v-model="slider_position" :show-tooltip="false" :debounce="600" :max="total_events - 1"
               @input="set_selection"></el-slider>
  </div>
</template>
<script>
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'

  export default {
    name: 'pc-time-slider',
    data () {
      return {
        slider_position: 1
      }
    },
    computed: {
      // ...mapState(['slider_position']),
      ...mapState(['total_events'])
    },
    methods: {
      ...mapMutations(['selected_index_will_change']),
      set_selection (e) {
        this.selected_index_will_change(e)
      }
    },
  }
</script>
<style scoped>
  .slider-dock {
    display: inline-block;
    width: 100%;
  }
</style>
