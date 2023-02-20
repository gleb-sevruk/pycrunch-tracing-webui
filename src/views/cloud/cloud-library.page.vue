<template>
  <div class="cloud-lib">
    <div class="d-flex  align-items-center">
      <h4 class="mt-2 p-4 0">Cloud Library</h4>
      <pc-cloud-storage-usage class="font-size-small" hide-plan></pc-cloud-storage-usage>
    </div>
    <pc-upload-recording></pc-upload-recording>

    <div class="recording-surface bg-apple-gray-3 min-vh-100 m-3 mt-2 rounded  m-5 px-5">
      <div class="recordings-list">
        <h6 class="pt-4 pb-2">My Recordings <span v-if="recordings">({{recordings.length}})</span></h6>

        <pc-cloud-recordings-table  v-loading="loading"  :recordings="recordings"></pc-cloud-recordings-table>
        <h6 class="pt-5 pb-0">Shared with Me <span v-if="shared_recordings">({{shared_recordings.length}})</span></h6>
        <pc-cloud-recordings-table :sharedMode="true" v-if="shared_recordings.length > 0" v-loading="loading"  :recordings="shared_recordings"></pc-cloud-recordings-table>
        <div v-if="!loading && shared_recordings.length === 0" class="text-secondary text-center">There is nothing shared with you yet</div>
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

const browserTitle = 'PyCrunch Tracing'

export default {
  name: 'cloud-library.page',
  components: { PcCloudStorageUsage, PcUploadRecording, PcCloudRecordingsTable },
  metaInfo () {
    return {
      titleTemplate: () => {
        return `Cloud Library | ${browserTitle}`
      },
    }
  },
  data () {
    return {
      recording_name: '',
      loading: false
    }
  },
  async mounted () {
    this.loading = true
    await this.load_profile()
    await this.load_recordings()
    this.loading = false

  },
  computed: {
    ...mapState('cloud', ['access_token', 'api_url', 'recordings', 'shared_recordings']),

  },
  methods: {
    ...mapActions('cloud', ['load_recordings', 'load_profile']),
  },
}
</script>

<style scoped>

</style>