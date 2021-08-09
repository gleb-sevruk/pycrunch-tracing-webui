<template>
  <div class="pc-cloud-storage-usage__component">
    <div v-if="!hidePlan" class="text-white-50 font-size-1">Usage:</div>
    <div v-if="!hidePlan" class="mt-1"><span >Plan:</span> free</div>
    <el-progress  class="mt-1 pb-1" :percentage="percentage_of_storage_used" :show-text="false"></el-progress>
    <div class="font-size-small mt-2 ">{{storage.used | humansize }} of {{storage.available | humansize }} used</div>
  </div>
</template>

<script>
export default {
  name: 'pc-cloud-storage-usage',
  props: {
    hidePlan: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      storage: {
        used: 125300000,
        available: 500*1024*1025

      },
    }
  },
  computed: {
    percentage_of_storage_used () {
      return (this.storage.used / this.storage.available) * 100
    },
  },
}
</script>

<style scoped>

</style>