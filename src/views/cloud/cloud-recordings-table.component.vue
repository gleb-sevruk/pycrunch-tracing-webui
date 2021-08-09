<template>
  <div>
    <el-progress v-if="progress.in_transit" :percentage="progress.percentage"> </el-progress>

    <el-table
      :data="recordings"
      style="width: 100%">

    <el-table-column
        prop="name"
        label="Name"
        width="380">
    </el-table-column>
    <el-table-column
        prop="recording_date"
        sortable
        label="Recording Date"
        width="260">
      <template slot-scope="scope">
        <span>
          <span v-if="scope.row.recording_date">{{ scope.row.recording_date | moment('MMMM Do YYYY, h:mm:ss a') }}
            </span>
          <span v-else>-</span>
          </span>
      </template>
    </el-table-column>
    <el-table-column
        prop="recording_date"
        label=""
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
        prop="total_events"
        label="Events Recorded">
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

      </template>
    </el-table-column>
  </el-table>
  </div>
</template>

<script>
import { Recording } from '@/store/cloud.module'
import axios from 'axios'
import { API_ROOT } from '@/config'
import { mapActions } from 'vuex'

export default {
  props: {
    recordings: {
      type: Array,
      default: null,
      required: true,
    },
  },
  data () {
    return {
      progress: {
        current: 0,
        target: 0,
        percentage: 0,
        in_transit: false,
      },
    }
  },
  name: 'pc-cloud-recordings-table',
  methods: {
    ...mapActions('cloud', ['load_recordings']),
    ...mapActions(['open_trace_from_array_buffer']),

    async willDeleteRecording (row: Recording) {
      let x = await axios.delete(API_ROOT + '/recordings/' + row.id)
      this.$notify.info(`Recording ${row.name} removed successfully.`)
      await this.load_recordings()
    },
    async openRecording (row) {
      let x = await axios.post(`${API_ROOT}/recordings/${row.id}/generate-download-url`)
      if (!x.data.href) {
        console.warn('Cannot get a link for recording')
        return
      }
      let s3 = x.data.href
      console.log(s3)
      this.progress.in_transit = true
      let response = await
          axios.get(
              s3,
              {
                responseType: 'arraybuffer',
                onDownloadProgress: (evt: ProgressEvent) => {
                  this.progress.current = evt.loaded
                  this.progress.target = evt.total
                  this.progress.percentage = Math.round((evt.loaded / evt.total) * 100)
                }
              },
          )

      this.open_trace_from_array_buffer(response.data)
      this.progress.in_transit = false

      // FileDownload(response.data, 'report.csv');
    },
    async userClickedMore (index, row, command) {
      if (command === 'delete') {
        await this.willDeleteRecording(row)
      }
      if (command === 'open') {
        await this.openRecording(row)

      }
      console.log('userClickedMore i', row, index, command)
    }
    ,
  },
}
</script>

<style scoped>

</style>