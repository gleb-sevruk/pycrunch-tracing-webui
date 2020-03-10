<template>
  <div class="pixie--root fixed-bottom">
    <div v-if="is_panel_visible('stack-graph.tooltip') && is_mouse_over_frame"
         class="stack-overlay-tooltip fixed-top bg-apple-gray-2" >
      {{current_frame}}
    </div>
    <div ref="js_pixie_container"  class="pixie--container">

    </div>
  </div>
</template>
<script>
  import * as PIXI from 'pixi.js'
  import { Viewport } from 'pixi-viewport'
  import {CodeEvent} from '../store/models'
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'
  let stage = null
  let viewport_to_gc = null
  class EventWithId{
    event: CodeEvent
    index: number
    constructor (event: CodeEvent, index: number) {
      this.event = event
      this.index = index
    }
  }

  class DrawState {
    viewport: Viewport
    needle: PIXI.Graphics

  }
  let draw_state = new DrawState()

  export default {
    name: 'pc-stack-frames',
    data () {
      return {
        is_mouse_over_frame: false,
        current_frame: null,
      }
    },
    beforeDestroy (): void {
      if (viewport_to_gc) {
        viewport_to_gc.destroy()
      }
      // if (stage) {
      //   stage.destroy()
      // }

    },
    watch : {
      selected_event(old, new_value) {
      console.log('updated')
      this.draw_needle()
      }
    },
    methods: {
      ...mapMutations(['selected_index_will_change']),
      draw_timeline: function (viewport) {
        let last_timestamp = global_state.command_buffer[global_state.command_buffer.length - 1].ts
        let time_line = new PIXI.Graphics();
        viewport.addChild(time_line);
        time_line.position.set(0, 0);

        let line_w = 2
        let line_top = -10
        let mark_bot = 10
        time_line.lineStyle(line_w, 0xffffff)
          .moveTo(0, line_top)
          .lineTo(last_timestamp, line_top);

        let total_marks = 10

        function lerp (value, limit_to_max) {
          if (value > limit_to_max) {
            return limit_to_max
          }
          return value
        }

        for (let index = 0; index <= total_marks; index++) {
          let color = 0xffffff
          if (index === total_marks - 1 || index === 0) {
            color = 0xffffff
          }
        //   |----------------?--------|
          let time_mark = new PIXI.Graphics();
          viewport.addChild(time_mark);
          time_mark.position.set(index, -10);
          let percentage_x = index / total_marks
          let x = lerp(percentage_x * last_timestamp, last_timestamp)
          time_mark.lineStyle(line_w /2, 0xffffff)
            .moveTo(x, line_top)
            .lineTo(x, mark_bot);

        }
      },
      draw_needle () {
        if (!this.selected_event) {
          return
        }
        let needle_ts = this.selected_event.ts

        function create_needle () {
          let needle = new PIXI.Graphics();
          draw_state.viewport.addChild(needle);
          let needle_top = -30
          needle.position.set(0, needle_top);
          let x = needle_ts //ms
          needle.lineStyle(2, 0xDE3249)
            .moveTo(x, -20)
            .lineTo(x, 2000);

          needle.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
          needle.beginFill(0xDE3249, 1);
          let needle_circle_radius = 8
          needle.drawCircle(x, needle_top + needle_circle_radius / 2, needle_circle_radius);
          needle.endFill();

          draw_state.needle = needle
        }

        if (!draw_state.needle) {
          create_needle()
        } else {
            draw_state.viewport.removeChild(draw_state.needle)
            create_needle()
        }
      }

    },

    mounted (): void {
      let self = this
      // create viewport
      let type = "WebGL"
      if(!PIXI.utils.isWebGLSupported()){
        type = "canvas"
      }
      this.$refs.js_pixie_container.addEventListener('wheel', e => {
        e.preventDefault()
      }, {passive: false})
      var app = new PIXI.Application(
        {
          forceCanvas: true,

          antialias:true, width: window.innerWidth, height: window.innerHeight
        });
      var viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1000,
        worldHeight: 1000,
        // noTicker: true,
        divWheel: this.$refs.js_pixie_container,
        interaction: app.renderer.interaction
        // the interaction module is important for wheel() to work properly when renderer.view is placed or scaled
      });
      draw_state.viewport = viewport
      viewport_to_gc = viewport
// add the viewport to the stage

      this.$refs.js_pixie_container.appendChild(app.view);
      app.stage.addChild(viewport);
      stage = app.stage
// activate plugins
      viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate();
      if (global_state.command_buffer.length <= 0){
        return
      }
      let style = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 36,
        fill: "white",
        stroke: '#ff3300',
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
      });
      let style_function = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 14,
        fill: "white",

      });
      let lastX = 0
      let lastY = 0
      let stack = []
      let total_boxes = 0
      let total_text_boxes = 0
      for (let current_index in global_state.command_buffer) {
        if (!global_state.command_buffer.hasOwnProperty(current_index)) {
          continue
        }
        let current: CodeEvent = global_state.command_buffer[current_index]

        if (current.event_name === 'method_enter') {
          stack.push(new EventWithId(current, current_index))
          // console.log('lastX', lastX)

        }
        if (current.event_name === 'method_exit') {
          let previous_stack: EventWithId = stack.pop()
          let previous_index = previous_stack.index
          let previous = previous_stack.event
          let sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
          //todo same function must have same color
          sprite.tint = 0xff0000 - current_index * 1000;

          // if our session is finished in 1 ms - we still want to see call graph
          let scale_factor = 1
          // scale_factor *= 1000

          let time_diff = (current.ts - previous.ts) * scale_factor
          sprite.width = time_diff
          let box_h = 20
          sprite.height = box_h
          lastY = stack.length * box_h + 2
          sprite.position.set(previous.ts, lastY);

          sprite.interactive = true;
          // hit area is relative to parent sprite
          sprite.hitArea = new PIXI.Rectangle(0, 0, time_diff, box_h);
          sprite.on('mouseover', (event) => {
            self.is_mouse_over_frame = true
            self.current_frame = current
            // console.log(current)
          });
          sprite.on('mouseover', (event) => {
            self.is_mouse_over_frame = true
            self.current_frame = current
            // console.log(current)
          });
          sprite.on('click', (event) => {
            // method start
            let target_index = previous_index
            if (event.data.originalEvent.shiftKey) {
              // or method end
              target_index = current_index
            }
            self.selected_index_will_change(Number.parseInt(target_index))
          });
          total_boxes++
          let microseconds = 50
          if (time_diff > microseconds) {
            let message = new PIXI.Text(this.short_filename(current.cursor.file, 1) +
              ':' + current.cursor.function_name, style_function);
            message.resolution = 2
            message.position.set(previous.ts, lastY);
            viewport.addChild(message);
            total_text_boxes++

          }
          lastX += time_diff + 1

        }
      }
      let message = new PIXI.Text(" total_boxes " +total_boxes , style);
      message.position.set(-420, -60);
      viewport.addChild(message);
      let message2 = new PIXI.Text("total_text_boxes " +total_text_boxes , style);
      message2.position.set(-420, -120);
      viewport.addChild(message2);
      this.draw_timeline(viewport)

      this.draw_needle()

    },
    computed: {
      ...mapGetters(['short_filename','is_panel_visible']),
      ...mapState(['selected_event']),
    },
  }
</script>
<style scoped lang="scss">
  @import "../styles/colors";
  .pixie--root {
    bottom: 30px;
  }
  .pixie--container {
    width: 100%;
    height: 50vh;
    background-color: $color-apple-gray-3;
  }
  .stack-overlay-tooltip {
    max-height: 30%;
    overflow: auto;
  }
</style>