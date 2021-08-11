<template>

  <div id="app" class="min-vh-100"  >
    <pc-header  ></pc-header>
    <router-view />
    <div  class=" fixed-top min-vh-100 vw-100 text-center pt-5" style="pointer-events: none; background-color: #00A048FA;" v-if="is_file_dragging" >Release file to open</div>
  </div>
</template>

<style lang="scss">
@import './styles/_colors.scss';

html, body {
  /*rubber band scrolling surface*/
  background-color: $color-background;
}
hr {
  background-color: $color-background-x3;
}

#app {
}

</style>
<script>
  import PcHeader from './views/header.component'
  import { mapActions } from 'vuex'
  export default {
    components: {PcHeader},
    data () {
      return {
        is_file_dragging: false
      }
    },
    mounted (): void {
      document.addEventListener('dragenter', this.drag_will_enter)
      document.addEventListener('dragleave', this.drag_will_exit)

      document.addEventListener("dragover", event => {
        event.preventDefault();
      });

      window.addEventListener('drop',  this.drag_did_drop)

    },
    beforeDestroy (): void {
      document.removeEventListener('dragenter', this.drag_will_enter)
      document.removeEventListener('dragleave',this.drag_will_exit)
      document.removeEventListener('drop',  this.drag_did_drop)
    },
    methods: {
      ...mapActions(['will_drag_drop_local_trace']),
      drag_did_drop(e) {
        if (this.shouldDisableGlobalDragDrop()) {
          return
        }

        console.log('Opening file by dragging')
        this.is_file_dragging = false
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.files.length <= 0) {
          return
        }
        this.will_drag_drop_local_trace(e)
      },
      shouldDisableGlobalDragDrop: function () {
        // do not want to drop on non-visible screen
        return this.$route.name === 'cloud-library'
      },
      drag_will_enter(e) {
        if (this.shouldDisableGlobalDragDrop()) {
          return
        }
        this.is_file_dragging = true
      },
      drag_will_exit(e) {
        // this.is_file_dragging = false
      }

    },
  }
</script>