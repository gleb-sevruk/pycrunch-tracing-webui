<template>
  <div class="home">
    <div class="timeline">
      <div class="method" v-for="method in timeline">
        <div class="markers">
          <span v-for="marker in method.markers" class="marker p-1 m-1"
                :class="marker.outgoing_call ? 'marker__with-call': ''">
            {{marker.line_number}}
            <!--            <div class="method method&#45;&#45;nested" v-if="marker.outgoing_call">-->
            <!--              - {{marker.outgoing_call.method_name}}-->
            <!--            </div>-->
          </span>
        </div>
        <div class="method__name">
          {{method.file_name}}:{{method.method_name}}
        </div>
      </div>
    </div>
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
  import {mapState} from 'vuex'
  import * as utils from '../utils'
  const regl2 = require('regl')
  const shader_frag = require('../shaders/simple-triangle/tri-frag.glsl')
  const shader_vert_tri = require('../shaders/simple-triangle/tri-vert.glsl')
  const shader_vert_circle = require('../shaders/circle-vert.glsl')

  export default {
    name: 'Home',
    components: {
      HelloWorld
    },
    data () {
      return {
        key: '1',
        regl: null,
      }
    },
    mounted (): void {
      let canvas = this.$refs.myCanvasContainer


      this.regl = regl2({
        container: canvas
      })
      // this.regl.attributes.antialias = true
      this.buttonWillClick()
    },
    methods: {
      createShader (gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
          return shader;
        }

        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
      },

      createProgram (gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
          return program;
        }

        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
      },
      createCircle() {
        let regl = this.regl
        let countOfVertices = 8*3
        return  regl({
          frag: shader_frag,

          vert: shader_vert_circle,
          // Here we define the vertex attributes for the above shader
          attributes: {
            // regl.buffer creates a new array buffer object
            a_vertexId: regl.buffer(utils.sequence(countOfVertices))
            // regl automatically infers sane defaults for the vertex attribute pointers
          },
          uniforms: {
            // This defines the color of the triangle to be a dynamic variable
            u_color: regl.prop('u_color'),
            u_numVerts: regl.prop('u_numVerts'),
            u_resolution: regl.prop('u_resolution')
          },

          // This tells regl the number of vertices to draw in this command
          count: countOfVertices
        })
      },
      createTriangle: function (regl) {
        return regl({
          frag: shader_frag,

          vert: shader_vert_tri,
          // Here we define the vertex attributes for the above shader
          attributes: {
            // regl.buffer creates a new array buffer object
            a_position: regl.buffer([
              [-10, -10],   // no need to flatten nested arrays, regl automatically
              [10, -10],    // unrolls them into a typedarray (default Float32)
              [10, 11]
            ])
            // regl automatically infers sane defaults for the vertex attribute pointers
          },

          uniforms: {
            // This defines the color of the triangle to be a dynamic variable
            u_color: regl.prop('u_color')
          },

          // This tells regl the number of vertices to draw in this command
          count: 3
        })
      },
      buttonWillClick () {
        let regl = this.regl
        let drawTriangle = this.createTriangle(regl)
// regl.frame() wraps requestAnimationFrame and also handles viewport changes
//         regl.frame(({time}) => {
        // clear contents of the drawing buffer
        regl.clear({
          color: utils.rgba(0, 0, 0, 0),
          depth: 1
        })
        let container = this.$refs.myCanvasContainer
        let drawCircle = this.createCircle()
        drawCircle({
          u_color: utils.rgb(0.6, 0, 0),
          u_resolution:[container.clientWidth, container.clientHeight],
          u_numVerts: 8*3,
        })
// draw a triangle using the command defined above
        drawTriangle({
          u_color: utils.rgb(0.5, 0, 0)
        })



        // })
        // regl.
      }
    },
    computed: {
      ...
        mapState(['timeline', 'x'])
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