// @flow
<template>
  <div class="home">

    <div class="timeline">
      <div class="method" v-for="method in timeline">
        <div class="markers">
          <span v-for="marker in method.markers" class="marker p-1 m-1"
                :class="marker.outgoing_call ? 'marker__with-call': ''">
            {{marker.line_number}}
<!--                        <div class="method method&#45;&#45;nested" v-if="marker.outgoing_call">-->
<!--                          - {{marker.outgoing_call.method_name}}-->
<!--                        </div>-->
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
  import * as utils from '../../../utils'
  import {Point, PrimitivesFactory} from '../../primitives'
  import {p} from '../../../utils'
  const regl2 = require('regl')
  const shader_frag = require('../simple-triangle/tri-frag.glsl')
  // const shader_vert_tri = require('../shaders/simple-triangle/tri-vert.glsl')
  const shader_vert_circle = require('../circle-vert.glsl')
  // const shader_vert_tri_with_transform = require('../shaders/tri-vert-with-transform.glsl')
  import {Screen} from '../../../webgl/positioning'

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
        let countOfVertices = 125*3
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

      buttonWillClick () {
        let regl = this.regl
        let factory = new PrimitivesFactory(regl)
        // let screen = new
        let circle = this.createCircle()

        let container = this.$refs.myCanvasContainer
        let screen = new Screen(container.clientWidth, container.clientHeight)
        screen.stateToConsole()
        let left = 100
        let width = 250
        let height = 250
        let right = left + width
        let top = 10
        let bottom = top + height

        let a = screen.toSurface(p(left,top))
        let b = screen.toSurface(p(right, top))
        let c = screen.toSurface(p(right, bottom))
        let d = screen.toSurface(p(left, bottom))
        // console.table({a, b,c, d})
        let rectDraw = regl(factory.createRect(
          a,
          b,
          c,
          d,
          ))

// regl.frame() wraps requestAnimationFrame and also handles viewport changes
//         regl.frame(({time}) => {
        // clear contents of the drawing buffer
        regl.clear({
          color: utils.rgba(0, 0, 0, 0),
          depth: 1
        })


        circle({
          u_color: utils.rgb(0.6, 0, 0),
          u_resolution:[container.clientWidth, container.clientHeight],
          u_numVerts: 8*3,
        })
        rectDraw({
          u_color: utils.rgb(0.9, 10, 0)
        })
        for (let i = 0; i<=10; i++) {

        }
        rectDraw3({
          u_color: utils.rgb(0.4, 0.7, 0)
        })


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