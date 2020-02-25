// @flow
<template>
  <div class="home">

    <div class="timeline">
      zalupa
      x={{x}}
      <div class="x">
      Is connected: {{is_connected}}
      </div>
    </div>
    <pc-tabbed-editor></pc-tabbed-editor>
    <div ref="myCanvasContainer" class="canvas__container js-canvas__container">
<!--      <canvas ref="myCanvas" class="js-canvas" width="700" height="400"></canvas>-->
    </div>
    <button @click="buttonWillClick()">
      Clac
    </button>
  </div>
</template>

<script>
  // @ is an alias to /src
  import HelloWorld from '@/components/HelloWorld.vue'
  import {mapState, mapActions} from 'vuex'
  import PcCodeViewer from './code/code-viewer.component'
  import PcTabbedEditor from './code/tabbed-editor.component'


  export default {
    name: 'Home',
    components: {
      PcTabbedEditor,
      PcCodeViewer,
      HelloWorld
    },
    data () {
      return {

      }
    },
    mounted (): void {
      this.connect()
    },
    methods: {
      ...mapActions(['connect','load_command_buffer']),
      buttonWillClick() {
        this.load_command_buffer()
      }
    },
    computed: {
      ...mapState(['x', 'is_connected'])
    }
    ,
  }
</script>
<style scoped>
  .timeline {
    position: relative;
  }

  .markers {
    background-color: #00A048;
    display: inline-block;
  }

  .marker {
    background-color: #156900;
    color: wheat;
    width: 2em;
    height: 2em;
    text-align: center;
    border-radius: 50%;
    display: inline-block;
  }

  .marker__with-call {
    background-color: red;

  }

  .canvas__container {
    width: 100%;
    height: 60vh;
    display: block;
  }
</style>