<template>
  <div class="tab-control">
    <div v-for="file in files" class="tab-control__file" @click="setSelected(file)">
      {{short_filename(file.filename)}}
    </div>
      <div class="file__line" v-for="line in lines">
          <span class="file__line-number">{{line.state}} {{line.index}}</span>
        {{line.text}}

    </div>
  </div>
</template>

<script>
  import {mapGetters, mapState} from 'vuex'

  export default {
    name: "pc-tabbed-editor",
    computed: {
      ...mapState(['files']),
      ...mapGetters(['short_filename', 'selected_file']),
      lines () {
        if (!this.selected_file) {
          return
        }
        let t = this.selected_file.contents
        let splited = this.splitLines(t)
        console.log(splited)
        let my_map = splited.map((line, index) => {
          let line_number = index + 1

          return ({
            index: line_number,
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

<style scoped>
  .file__line {
    white-space: pre;
    font-family: monospace;
    text-align: left;
    width: 600px;
    margin: 0 auto;
  }
  .file__line-number {
    display: inline-block;
    width: 50px;
    user-select: none;
    border-right: 1px solid #6c757d;
    margin-right: 1em;

  }
  .file__line:hover {
    background-color: #c1d4e0;
  }
</style>