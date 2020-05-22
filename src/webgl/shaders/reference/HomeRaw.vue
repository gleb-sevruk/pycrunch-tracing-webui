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
    <div class="canvas__container">
      <canvas ref="myCanvas" class="canvas"></canvas>
    </div>
    <button @click="buttonWillClick()">
      Clac
    </button>
  </div>
</template>

<script>
  // @ is an alias to /src
  import {mapState} from 'vuex'


  export default {
    name: 'Home',
    components: {
      HelloWorld
    },
    data () {
      return {
        key: '1'
      }
    },
    mounted (): void {
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
      buttonWillClick () {
        let canvas = this.$refs.myCanvas

        var gl = canvas.getContext("webgl");
        if (!gl) {
          return;
        }

        // Get the strings for our GLSL shaders

        var vertexShaderSource = require('./2d-vertex-shader.glsl');
        var fragmentShaderSource = require('./2d-fragment-shader.glsl');
        // create GLSL shaders, upload the GLSL source, compile the shaders
        // var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
        // var fragmentShaderSource = document.getElementById("2d-fragment-shader").text;

        var vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        var fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Link the two shaders into a program
        var program = this.createProgram(gl, vertexShader, fragmentShader);

        // look up where the vertex data needs to go.
        // REFERENCE to variable in shader

        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        var colorUniformLocation = gl.getUniformLocation(program, "u_color");

        // Create a buffer and put three 2d clip space points in it
        var positionBuffer = gl.createBuffer();

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        var positions = [
          10, 20,
          80, 20,
          10, 30,
          10, 30,
          80, 20,
          80, 30,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // code above this line is initialization code.
        // code below this line is rendering code.

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);


        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
          positionAttributeLocation, size, type, normalize, stride, offset);

        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        function randomInt (range) {
          return Math.floor(Math.random() * range);
        }

// Fill the buffer with the values that define a rectangle.
        function setRectangle (gl, x, y, width, height) {
          var x1 = x;
          var x2 = x + width;
          var y1 = y;
          var y2 = y + height;
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
          ]), gl.STATIC_DRAW);
        }

        // draw
        for (var ii = 0; ii < 50; ++ii) {
          // задаём произвольный прямоугольник
          // Запись будет происходить в positionBuffer,
          // так как он был привязан последник к
          // точке связи ARRAY_BUFFER
          setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

          // задаём случайный цвет
          gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

          // отрисовка прямоугольника
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
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

  canvas {
    width: 100%;
    height: 60vh;
    display: block;
  }
</style>