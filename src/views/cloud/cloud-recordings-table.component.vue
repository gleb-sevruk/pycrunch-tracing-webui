<template>
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
        width="380">
      <template slot-scope="scope">
        <span>
          <span v-if="scope.row.recording_date">{{ scope.row.recording_date | moment('MMMM Do YYYY, h:mm:ss a') }} ({{
              scope.row.recording_date | moment('from', 'now')
            }} )</span>
          <span v-else>-</span>
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
            @command="userClickedMore(scope.$index, scope.row)"
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
</template>

<script>
import filesize from 'file-size'

export default {
  props: {
    recordings: {
      type: Array,
      default: null,
      required: true,
    },
  },
  name: 'pc-cloud-recordings-table',
  methods: {
    humanSize (bytes) {
      if (!bytes) {
        return '-'
      }
      return filesize(bytes).human()
    },
    userClickedMore (index, row) {
      console.log('userClickedMore i', row, index)
    },
  },
}
</script>

<style scoped>

</style>