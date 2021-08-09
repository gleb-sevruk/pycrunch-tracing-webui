<template>
  <div class="cloud-lib">
    <div class="d-flex  align-items-center">
      <h4 class="mt-2 p-4 0">Cloud Library</h4>
      <pc-cloud-storage-usage class="font-size-small" hide-plan></pc-cloud-storage-usage>
    </div>
    <pc-upload-recording></pc-upload-recording>

    <div class="recording-surface bg-apple-gray-3 min-vh-100 m-3 mt-2 rounded  m-5 px-5">

      <div class="recordings-list" v-loading="loading">
        <h6 class="pt-4 pb-2">My Recordings</h6>
        <pc-cloud-recordings-table v-if="!loading" :recordings="recordings"></pc-cloud-recordings-table>

      </div>

    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import axios from 'axios'
import PcCloudRecordingsTable from '@/views/cloud/cloud-recordings-table.component'
import PcUploadRecording from '@/views/cloud/upload/upload-recording.component'
import PcCloudStorageUsage from '@/views/cloud/cloud-storage-usage.component'

export default {
  name: 'cloud-library.page',
  components: { PcCloudStorageUsage, PcUploadRecording, PcCloudRecordingsTable },
  data () {
    return {
      recording_name: '',
      loading: false
    }
  },
  async mounted () {
    this.loading = true
    await this.load_recordings()
    this.loading = false

  },
  computed: {
    ...mapState('cloud', ['access_token', 'api_url', 'recordings']),

  },
  methods: {
    ...mapActions('cloud', ['load_recordings']),
  },
}
</script>

<style scoped>

</style>