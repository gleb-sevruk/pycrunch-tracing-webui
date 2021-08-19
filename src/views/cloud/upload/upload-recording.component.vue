<template>
  <div class="new-rec-upload  bg-apple-gray-4 elevation-03 mx-5 my-0 px-5 py-4">
    <h6>Upload existing recording<span v-if="has_file"> -> Verify and upload</span></h6>
    <div v-show="!has_file">
<!--      <label>Select a file for the recording:</label>-->

      <el-upload
          class="bg-apple-gray-4 el-upload--custom"
          drag
          action="/dev/null"
          :on-preview="handlePreview"
          :on-change="fileInputWillChange"
          :on-remove="handleRemove"
          :auto-upload="false"
          :show-file-list="false"
          :limit="1"
          ref="file_upload_control"
          :file-list="fileList"
      >
        <div class="bg-apple-gray-3 my-upload-class">
          <i class="el-icon-upload"></i>
          <div class="text-white">Drop file here or <em>click to upload</em></div>
          <div class="el-upload__tip" slot="tip">session.chunked.pycrunch-trace files</div>
        </div>
      </el-upload>

    </div>
    <el-dialog title="Upload selected trace"

               :before-close="beforeCloseModal"
               :close-on-click-modal="false"
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
            <div>{{ meta.start_time | momentLong  }}</div>
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
        <el-progress :show-text="false" :percentage="progress.percentage"></el-progress>
        <div>
          <span class="mx-3">{{ debounced_current_percentage | round(2) }}%</span>
          <span class="text-secondary">{{ debounced_current_progress | humansize }} of {{
              progress.target | humansize
            }}</span>
        </div>
      </div>
      <div v-if="progress.upload_completed" class="d-flex justify-content-end align-items-end">

        <el-button type="success" @click="goToRecordings">Go to my recordings</el-button>
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
  file_selected: null,

  data () {
    return {
      recording_name: '',
      loading: false,
      has_file: false,
      meta: null,
      fileList: [],
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
    nativeDrop(event) {
      // This is to prevent listener action inside App.vue
      event.stopPropagation()
      event.preventDefault()
    },
    handleRemove (file, fileList) {
      console.log(file, fileList)
    },
    handlePreview (file) {
      console.log(file)
    },
    clearFileInput: function () {
      let input1 = this.$refs.file_upload_control
      input1.clearFiles()
    },
    goToRecordings () {
      this.dialog_open = false
      this.has_file = false
      this.clearFileInput()

      this.progress.upload_completed = false
    },
    async beforeCloseModal (done) {
      if (this.progress.upload_completed) {
        this.goToRecordings()
        done()
        return
      }

      if (this.progress.in_transit) {
        try {
          let x = await this.$confirm('Are you sure to close this dialog?')
          this.has_file = false
          done()
        } catch (e) {

        }
        return
      }

      this.has_file = false
      this.clearFileInput()
      done()

    },
    // fileInputWillChange2 (native_event) {
    //   console.log('fileInputWillChange 2', native_event)
    //
    // },
    fileInputWillChange (el_input_file, fileList) {
      console.log('fileInputWillChange', file)
      const file = el_input_file.raw
      this.$options.file_selected = file
      let name = file.name
      const reader = new FileReader()
      reader.onload = (e: any) => {
        let buffer: ArrayBuffer = e.target.result
        let metadata = read_binary_file(null, name, buffer, [TLV_TAGS.TRACE_TAG_HEADER, TLV_TAGS.TRACE_TAG_METADATA], false)
        this.has_file = isDefined(metadata)
        if (!isDefined(metadata)) {
          this.$notify.error(
              {
                title: `${el_input_file.name} is not a valid recording.`,
                message: `Cannot read trace metadata, please try different file.`,
                // duration: 0,
              },
          )
          console.log('dd')
          this.clearFileInput()
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
      try {
        let firstFile = this.$options.file_selected
        this.progress.target = firstFile.size
        this.progress.current = 0
        this.progress.percentage = 0
        this.progress.in_transit = true
        this.progress.upload_completed = false
        const cancelTokenSource = axios.CancelToken.source()
        this.progress.cancellation_token = cancelTokenSource

        // get temporary upload link to s3 and update database
        let response = await axios.post(API_ROOT + '/recordings',
            {
              name: this.meta.name,
              size_in_bytes: this.meta.file_size_in_bytes,
              total_events: this.meta.events_in_session,
              recording_date: this.meta.start_time,
              recording_end_date: this.meta.end_time,
            },
            {
              cancelToken: cancelTokenSource.token,
            },
        )
        let new_recording = response.data
        let s3_url = new_recording.href
        console.log('Created draft, will start uploading to S3...')
        console.log('  ', s3_url)

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
        this.$nextTick(async () => await this.load_recordings())

      } catch (e) {
        console.log('Upload to S3 failed with error:', e)
        return
      } finally {
        this.progress.in_transit = false
        this.progress.cancellation_token = null
        return
      }
    },

  },
  computed: {
    //debounce computed

    debounced_current_progress () {
      return this.progress.current
    },
    debounced_current_percentage () {
      return this.progress.percentage
    },
  },
}
</script>

<style lang="scss">
.my-upload-class {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-content: stretch;
  height: 100%;
}

.el-upload--custom {
  .el-icon-upload {
    margin-top: 0.25em;
    margin-bottom: 0.25em;
    font-size: 2em;
  }
  .el-upload-dragger {
    width: 380px;
    height: 130px;
  }
}
</style>