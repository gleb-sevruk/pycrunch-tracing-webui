<template>
  <div class="new-rec-upload  bg-apple-gray-4 elevation-03 mx-5 my-0 px-5 py-4">
    <h6>Upload existing recording<span v-if="has_file"> -> Verify and upload</span></h6>
    <div v-show="!has_file">
      <label>Select a file for the recording:</label>
      <input ref="our_file_to_upload" @change="fileInputWillChange" type="file" class="w-25 ml-3"></input>
    </div>
      <el-dialog title="Upload selected trace"
                 :close-on-click-modal="false"
                 :before-close="beforeCloseModal"
                 :close-on-press-escape="false"
                 :show-close="!progress.in_transit"
                 :visible.sync="dialog_open"
      >
        <div v-if="has_file" class="mt-n4">
          <el-alert
              v-if="progress.upload_completed"
              class="mt-2"
              title="Upload completed successfully"
              type="success"
              show-icon>
          </el-alert>
          <div v-if="meta" class="mb-4">

            <h6 class="mt-3">{{ meta.name }}</h6>
            <div class="text-white-50 small">{{ meta.file_size_in_bytes | humansize }}</div>
            <div v-if="meta.start_time" class="mt-2">
              <div>{{ meta.start_time | moment('MMMM Do YYYY, h:mm:ss a') }}</div>
              <div class="small">({{ meta.start_time | moment('from', 'now') }})</div>
            </div>
            <div v-if="meta.events_in_session" class="mt-2">
              <span class="small">Total events:</span> {{ meta.events_in_session.toLocaleString() }}
            </div>

          </div>
          <div v-if="!progress.upload_completed">

            <el-button v-if="!progress.in_transit " @click="uploadNow" icon="el-icon-upload">Upload now</el-button>
           <el-button v-if="progress.in_transit" @click="cancelTransmission" icon="el-icon-cancel">Abort</el-button>
          </div>
        </div>
        <div v-if="progress.in_transit">
          <el-progress  :show-text="false" :percentage="progress.percentage"></el-progress>
          <div>
            <span class="mx-3">{{progress.percentage | round(2)}}%</span>
            <span class="text-secondary">{{progress.current | humansize}} of {{progress.target | humansize}}</span>
          </div>
        </div>
        <div v-if="progress.upload_completed" class="d-flex justify-content-end align-items-end">

          <el-button  type="success" @click="goToRecordings">Go to my recordings</el-button>
        </div>

      </el-dialog>



  </div>
</template>

<script>
import axios from 'axios'
import { read_binary_file, TLV_TAGS } from '@/binary-format/parsing'
import { API_ROOT } from '@/config'
import { mapActions } from 'vuex'

export const isDefined = (val) => {
  return val !== undefined && val !== null
}

export default {
  name: 'pc-upload-recording',
  data () {
    return {
      recording_name: '',
      loading: false,
      has_file: false,
      meta: null,
      dialog_open: false,
      progress: {
        current: 0,
        target: 0,
        percentage: 0,
        in_transit: false,
        upload_completed: false,
        cancellation_token: null,
      },
    }
  },
  methods: {
    ...mapActions('cloud', ['load_recordings']),

    goToRecordings () {
      this.dialog_open = false
      this.has_file = false
      let input1 = this.$refs.our_file_to_upload
      //reset input/file https://stackoverflow.com/a/16222877/2377370
      input1.value = ''

      this.progress.upload_completed = false
      this.$nextTick(async () => await this.load_recordings())
    },
    beforeCloseModal(done) {
      if (this.progress.upload_completed) {
        this.goToRecordings()
        done()
        return
      }

      this.$confirm('Are you sure to close this dialog?')
        .then(_ => {
          this.has_file = false
          done();
        })
        .catch(_ => {});
    },
    fileInputWillChange (native_event) {
      console.log('fileInputWillChange')

      const file = native_event.target.files[0]
      let name = file.name
      const reader = new FileReader()
      reader.onload = (e: any) => {
        let buffer: ArrayBuffer = e.target.result
        let metadata = read_binary_file(null, name, buffer, [TLV_TAGS.TRACE_TAG_HEADER, TLV_TAGS.TRACE_TAG_METADATA], false)
        this.has_file = isDefined(metadata)
        if (!isDefined(metadata)) {
          this.$notify.error('Failed to read trace metadata, please try different file.')
          return
        }
        this.meta = metadata
        this.dialog_open = true

      }

      reader.readAsArrayBuffer(file)

    },
    async cancelTransmission () {
      if (this.progress.cancellation_token) {
        console.warn('User requested cancellation.')
        this.progress.cancellation_token.cancel()
      }
    },
    async uploadNow () {
      // get temporary upload link to s3 and update database
      let response = await axios.post(API_ROOT + '/recordings',
          {
            name: this.meta.name,
            size_in_bytes: this.meta.file_size_in_bytes,
            total_events: this.meta.events_in_session,
            recording_date: this.meta.start_time,
            recording_end_date: this.meta.end_time,
          })
      let new_recording = response.data
      let s3_url = new_recording.href
      console.log('Created draft, will start uploading to S3...')
      console.log('  ', s3_url)
      let files = this.$refs.our_file_to_upload.files
      let firstFile = files[0]
      this.progress.current = 0

      const cancelTokenSource = axios.CancelToken.source()

      this.progress.target = firstFile.size
      this.progress.percentage = 0
      this.progress.in_transit = true
      this.progress.upload_completed = false
      this.progress.cancellation_token = cancelTokenSource
      try {
        let c = await axios.put(
            s3_url,
            firstFile,
            {
              onUploadProgress: progressEvent => {
                this.progress.current = progressEvent.loaded
                let percentage = (this.progress.current / this.progress.target) * 100
                this.progress.percentage = percentage
              },
              cancelToken: cancelTokenSource.token,
            },
        )

        console.log('Uploaded to S3 with following response:', c)

        response = await axios.post(API_ROOT + `/recordings/${new_recording.id}/upload-completed`)
        this.progress.upload_completed = true

      }
      catch (e) {
        console.log('Upload to S3 failed with error:', e)
        return
      }
      finally {
        this.progress.in_transit = false
        this.progress.cancellation_token = null
        return
      }
    },

  },
  computed: {},
}
</script>

<style scoped>

</style>