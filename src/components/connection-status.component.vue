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
  export default {
    name: "pc-connection-status"
  }
</script>

<style scoped>

</style>