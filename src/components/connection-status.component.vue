<template>
  <span class="bg">
  <i v-if="is_connected" class="el-icon-circle-check" style="color: green;"></i>
  <i v-if="!is_connected" class="el-icon-circle-check" style="color: green;"></i>
  </span>
<!--  <div class="">-->
<!--    {{is_connected}}-->
<!--  </div>-->
</template>

<script>
  import {mapState} from 'vuex'

  export default {
    name: "pc-connection-status",
    computed: {
      ...mapState(['is_connected'])
    },
  }
</script>

<style scoped>

</style>