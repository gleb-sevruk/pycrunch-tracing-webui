<template>
  <div class="pc-cloud-storage-usage__component">
    <div v-if="!hidePlan" class="text-white-50 font-size-1">Usage:</div>
    <div v-if="!hidePlan" class="mt-1"><span >Plan:</span> free</div>
    <el-progress v-if="profile" class="mt-1 pb-1" :percentage="percentage_of_storage_used" :show-text="false"></el-progress>
    <div v-if="profile" class="font-size-small mt-2 ">{{profile.used_bytes | humansize }} of {{profile.available_bytes | humansize }} used</div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

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
    }
  },
  computed: {
    ...mapState('cloud', ['profile']),
    percentage_of_storage_used () {
      if (!this.profile) {
        return 0
      }
      let number = (this.profile.used_bytes / this.profile.available_bytes) * 100
      if (number > 100) {
        number = 100
      }
      return number
    },
  },
}
</script>

<style scoped>

</style>