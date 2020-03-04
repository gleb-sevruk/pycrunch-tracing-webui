<template>
  <div class="tab-control">
<!--    <div v-for="file in files" class="tab-control__file" @click="setSelected(file)">-->
<!--      {{short_filename(file.filename)}}-->
<!--    </div>-->
    <div class="container-fluid">
      <div class="row">
        <div class="col-6">
          <div class="file-editor">
            <div v-for="line in lines" class="file__line" :class="line.is_selected ? 'file__line--highlighted elevation-03' : ''" >
              <a :name="'line' + line.index"/>
              <span class="file__line-number text-secondary">{{line.state}} {{line.index}}</span>
              {{line.text}}
            </div>
          </div>
        </div>
        <div class="col-6">

          <pc-right-toolbar v-if="is_panel_visible('widgets.inspector')"></pc-right-toolbar>

        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import {mapGetters, mapState} from 'vuex'
  import PcRightToolbar from '../right-toolbar/right-toolbar.component'

  export default {
    name: "pc-tabbed-editor",
    components: {
      PcRightToolbar},

    computed: {
      ...mapState(['files', 'selected_index', 'selected_event']),
      ...mapGetters(['short_filename', 'selected_file', 'total_events', 'is_panel_visible']),

      lines () {
        if (!this.selected_file) {
          return
        }
        let t = this.selected_file.contents
        let splited = this.splitLines(t)
        let cursor_index = null
        let is_selected = false
        if (this.selected_event) {
          cursor_index = this.selected_event.cursor.line
        }


        // console.log(splited)
        let my_map = splited.map((line, index) => {
          let line_number = index + 1

          return ({
            index: line_number,
            is_selected: cursor_index && cursor_index === line_number,
            text: line
          })

        })
        return my_map
      },
    },

    data () {
      return {
      }
    },
    methods: {
      setSelected (file) {
        this.selected_file = file
      },
      splitLines (t) {
        if (!t) {
          return []
        }
        return t.split(/\r\n|\r|\n/)
      },

    },

  }
</script>

<style scoped lang="scss">
  @import "../../styles/colors";
  .file__line {
    white-space: pre;
    font-family: monospace;
    text-align: left;
    /*width: 600px;*/
    margin: 0 auto;
  }
  .file__line--highlighted {
    background: #15522B;
   // color: $color-apple-gray-5;
  }
  .file__line-number {
    display: inline-block;
    width: 50px;
    user-select: none;
    border-right: 1px solid #6c757d;
    margin-right: 1em;

  }
  .file__line:hover {
    background-color: $color-background-x1;
  }

  .file-editor {
    /*width: 500px;*/
  }
</style>