<template>
  <div>
    <div v-if="progress.in_transit" class="please-wait__loading-recording">

      <el-progress class="faster-transition" :percentage="progress.percentage"></el-progress>
      <el-button type="warning" @click="cancelRecordingLoading">Cancel download</el-button>
    </div>
    <div class="d-flex align-items-end justify-content-end align-content-stretch">
      <el-checkbox v-model="useUploadDate">Use upload date</el-checkbox>

    </div>
    <el-table
        :data="recordings"
        style="width: 100%"

    >

      <el-table-column
          prop="name"
          label="Name"
          width="380">
      </el-table-column>
      <el-table-column v-if="!useUploadDate"
                       prop="recording_date"
                       sortable
                       :key="'recording_date2'"
                       label="Recording Date"
                       width="260">
        <template slot-scope="scope">
        <span>
          <span v-if="scope.row.recording_date">{{ scope.row.recording_date | momentLong }}
            </span>
          <span v-else>-</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column
          v-if="!useUploadDate"
          prop="recording_date"
          label=""
          :key="'recording_date1'"
          width="150">
        <template slot-scope="scope">
        <span>
          <span v-if="scope.row.recording_date">{{
              scope.row.recording_date | moment('from', 'now')
            }} </span>
          <span v-else></span>
          </span>
        </template>
      </el-table-column>
      <el-table-column
          v-if="useUploadDate"
          prop="upload_date"
          sortable
          label="Upload Date"
          :key="'upload_date1'"
          width="260">
        <template slot-scope="scope">
        <span>
          <span v-if="scope.row.upload_date">{{ scope.row.upload_date | momentLong }}
            </span>
          <span v-else>-</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column
          v-if="useUploadDate"
          prop="upload_date"
          :key="'upload_date2'"
          label=""
          width="150">
        <template slot-scope="scope">
        <span>
          <span v-if="scope.row.upload_date">{{
              scope.row.upload_date | moment('from', 'now')
            }} </span>
          <span v-else></span>
          </span>
        </template>
      </el-table-column>
      <el-table-column
          prop="total_events"
          label="Events">
      </el-table-column>
      <el-table-column
          width="180"
          sortable
          prop="size_in_bytes"
          label="Size"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.size_in_bytes | humansize }}</span>
        </template>
      </el-table-column>

      <el-table-column
          label="Operations">
        <template slot-scope="scope">
          <el-dropdown
              type="info"
              @command="userClickedMore(scope.$index, scope.row, $event)"
          >
            <el-button icon="el-icon-more">
            </el-button>

            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command="'open'">
                Open
              </el-dropdown-item>
              <el-dropdown-item :command="'download'">
                Download
              </el-dropdown-item>
              <el-dropdown-item :command="'share'">
                Share...
              </el-dropdown-item>
              <el-dropdown-item divided :command="'delete'">
                Delete
              </el-dropdown-item>


            </el-dropdown-menu>
          </el-dropdown>
<!--          <el-button type="danger" @click="willDeleteRecording(scope.row)" icon="el-icon-delete">-->
<!--            del-->
<!--          </el-button>-->

        </template>
      </el-table-column>
    </el-table>
    <el-dialog :visible.sync="sharing_modal_visible" title="Sharing options">
      <pc-recording-sharing v-if="sharing_modal_visible" ></pc-recording-sharing>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { API_ROOT } from '@/config'
import { mapActions } from 'vuex'
import { loaderServiceOptions } from '@/shared/preloader'
import PcRecordingSharing from '@/views/cloud/recording-sharing.component'

export default {
  components: { PcRecordingSharing },
  props: {
    recordings: {
      type: Array,
      default: null,
      required: true,
    },
  },
  data () {
    return {
      useUploadDate: false,
      sharing_modal_visible: false,
      progress: {
        current: 0,
        target: 0,
        percentage: 0,
        in_transit: false,
        cancellation_token: null,
      },

    }
  },
  name: 'pc-cloud-recordings-table',
  methods: {
    ...mapActions('cloud', ['load_recordings']),
    ...mapActions(['open_trace_from_array_buffer']),
    cancelRecordingLoading () {
      this.progress.cancellation_token.cancel()
    },
    async willDeleteRecording (row) {
      console.log('sss2')
      try {
        await this.$confirm('Are you sure you want to remove trace file?', `Removing ${row.name}`)
      }
      catch {
        return
      }
      this.$message(`Removing recording ${row.name}...`);
      let x = await axios.delete(API_ROOT + '/recordings/' + row.id)
      this.$notify.success(`Recording ${row.name} removed successfully.`)
      await this.load_recordings()
    },
    redirectToTraceView: async function () {
      if (this.$route.matched[0].name !== 'Home') {
        await this.$router.push('/')
      }
    },
    async getRecordingOneTimeLink (row) {
      return await axios.post(`${API_ROOT}/recordings/${row.id}/generate-download-url`)
    },
    async openRecording (row) {
      this.progress.in_transit = true
      this.progress.current = 0
      this.progress.percentage = 0
      this.progress.target = 100
      try {
        let x = await this.getRecordingOneTimeLink(row)
        if (!x.data.href) {
          console.warn('Cannot get a link for recording')
          return
        }
        let s3 = x.data.href
        console.log(s3)
        const cancelTokenSource = axios.CancelToken.source()
        this.progress.cancellation_token = cancelTokenSource

        let response = await
            axios.get(
                s3,
                {
                  responseType: 'arraybuffer',
                  onDownloadProgress: (evt: ProgressEvent) => {
                    this.$nextTick(() => {
                      this.progress.current = evt.loaded
                      this.progress.target = evt.total
                      this.progress.percentage = Math.round((evt.loaded / evt.total) * 100)
                    })
                  },

                  cancelToken: cancelTokenSource.token,
                },
            )
        const loading = this.$loading(loaderServiceOptions);
        setTimeout(async () => {
          this.open_trace_from_array_buffer(response.data)
          await this.redirectToTraceView()
          this.progress.in_transit = false
          loading.close()

        }, 170)

      } catch (error) {
        if(!axios.isCancel(error)) {
          this.$notify.error(`Failed to open recording. Check console logs for more details`)
          console.error('Failed to open recording', error)
        }
        this.progress.in_transit = false
      }

      // FileDownload(response.data, 'report.csv');
    },
    async userClickedMore (index, row, command) {
      if (command === 'delete') {
        await this.willDeleteRecording(row)
      }
      if (command === 'open') {
        await this.openRecording(row)

      }
      if (command === 'download') {
        await this.downloadRecording(row)
      }

      if (command === 'share') {
        this.sharing_modal_visible = true
      }

      console.log('userClickedMore i', row, index, command)
    },
    async downloadRecording (row) {
      let x = await this.getRecordingOneTimeLink(row)
      if (!x.data.href) {
        console.warn('Cannot get a link for recording')
        return
      }

      let href = x.data.href
      console.log('href', href)
      window.location.href = href;

      // window.open(href)

    },
  },
}
</script>

<style>
.please-wait__loading-recording .el-progress-bar__inner {
  /*transition: none !important;*/
  transition: width 0.156s ease !important;
}
</style>