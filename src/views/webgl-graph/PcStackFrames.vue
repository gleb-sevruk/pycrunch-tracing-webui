<template>
  <div class="pixie--root fixed-bottom">
    <div v-if="is_panel_visible('stack-graph.tooltip') && is_mouse_over_frame"
         class="stack-overlay-tooltip fixed-top bg-apple-gray-2" >
      {{current_frame.cursor.function_name}}, {{current_frame.cursor.file}}
    </div>
    <div ref="js_pixie_container"  class="pixie--container">

    </div>
  </div>
</template>
<script>
  import * as PIXI from 'pixi.js'
  import { Viewport } from 'pixi-viewport'
  import {CodeEvent} from '../../store/models'
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'
  import {FileColors} from '../../graph-canvas'
  import styles from './styles'
  let Color = require('color')

  let _colors = new FileColors()
  window.___colors_files = _colors
  let stage = null
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
    size: Size
    stage: PIXI.Container
    app: PIXI.Application
    win_size: Size
    // if our session is finished in 1 ms - we still want to see call graph
    // scale_factor *= 1000
    scale_factor: number = 1
  }

  class Size {
    width: number
    height: number
    constructor (width: number, height: number) {
      this.width = width
      this.height = height
    }
  }
  let box_h = 20

  let state = new DrawState()

  class RenderStats {
    total_boxes : number = 0
    total_text_boxes : number = 0
    new_box() {
      this.total_boxes++
    }
    new_text() {
      this.total_text_boxes++
    }
  }

  class RenderState {
    max_y: number = 0
    lastX: number = 0
    lastY: number = 0
    stack: Array<number, CodeEvent> = []
    perf: RenderStats  = new RenderStats()
    start_ts: number = 0
    will_start_from (ts: number) {
      this.start_ts = ts
    }
    recalculate_last_y_based_on_stack_depth () {
      this.lastY = this.stack.length * box_h + 2
      if (this.max_y < this.lastY) {
        this.max_y = this.lastY
      }
    }
    should_draw_text (time_diff: number) {
      let microseconds = 50
      return time_diff > microseconds
    }

  }

  let _render_state = new RenderState()

  class MethodSpan {
    start: EventWithId
    end: EventWithId
    constructor (start: EventWithId, end: EventWithId) {
      this.start = start
      this.end = end
    }
  }

  export default {
    name: 'pc-stack-frames',
    data () {
      return {
        is_mouse_over_frame: false,
        current_frame: null,
      }
    },
    beforeDestroy (): void {
      if (state.viewport) {
        state.viewport.destroy()
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
      demo_animation: function (prev) {
        state.viewport.removeChildren()
        let full_text = 'ti pidr'
        let message = new PIXI.Text('t', styles.style_pidr);
        message.resolution = 2
        message.position.set(prev.ts, 10);
        state.viewport.addChild(message);
        let accum = 0
        // delta in ms
        state.app.ticker.add((delta) => {
          accum += delta
          if (accum % 100 > 10) {
            message.text = 'wak'
          }
          if (accum % 100 > 20) {
            message.text = 'wake up'
          }
          if (accum % 100 > 40) {
            message.text = 'wake up, pidor...'
          }
          if (accum % 200 > 150) {
            message.text = 'wake up, pidor... Matrix has you'
          }
          // style_pidr.fill = 0xff0000 + (accum / 10000)

          // rotate the container!
          // use delta to create frame-independent transform
          // message.rotation -= 0.01 * delta;
          // message.position -= 0.01 * delta;
        })
      },
      draw_single_event: function (current_index, self) {
        if (!global_state.command_buffer.hasOwnProperty(current_index)) {
          return
        }

        let current: CodeEvent = global_state.event_at(current_index)
        if (current.event_name === 'method_enter') {
          _render_state.stack.push(new EventWithId(current, current_index))
        }
        if (current.event_name === 'method_exit') {
          let previous_stack: EventWithId = _render_state.stack.pop()
          let end = new EventWithId(current, current_index)
          let span = new MethodSpan(previous_stack, end)


          let sprite = state.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));

          let time_diff = (span.end.event.ts - span.start.event.ts) * state.scale_factor
          let original_color = _colors.for_file_method(current.cursor.file, current.cursor.function_name, time_diff)
          sprite.tint = original_color;

          sprite.width = time_diff
          sprite.height = box_h

          _render_state.recalculate_last_y_based_on_stack_depth()


          let relative_position_x = (span.start.event.ts - _render_state.start_ts) * state.scale_factor
          sprite.position.set(relative_position_x, _render_state.lastY);

          sprite.interactive = true;
          // hit area is relative to parent sprite
          sprite.hitArea = new PIXI.Rectangle(0, 0, time_diff, box_h);

          sprite.on('mouseover', (event) => {
            self.is_mouse_over_frame = true
            self.current_frame = current
            sprite.tint = styles.hover_color
          });
          sprite.on('mouseout', (event) => {
            self.is_mouse_over_frame = false
            self.current_frame = null
            sprite.tint = original_color
          });
          sprite.on('click', (event) => {
            if (event.data.originalEvent.metaKey) {
              this.scope_to_method(span.start.event, span.end.event)
              return
            }
            // go to event
            // method start
            let target_index = span.start.index
            if (event.data.originalEvent.shiftKey) {
              // or method end
              target_index = current_index
            }

            self.selected_index_will_change(Number.parseInt(target_index))
          });
          _render_state.perf.total_boxes++

          // todo use pixi TextMetrics
          if (_render_state.should_draw_text(time_diff)) {
            let skip_filename = false
            if (_render_state.stack.length > 0) {
              let upper_frame: EventWithId = _render_state.stack[_render_state.stack.length - 1];
              if (upper_frame.event.cursor.file === current.cursor.file) {
                skip_filename = true
              }
            }
            let text
            if (!skip_filename) {
              text = this.short_filename(span.end.event.cursor.file, 1) + ':' + span.end.event.cursor.function_name
            } else {
              text = span.end.event.cursor.function_name + '()'
            }

            let message = new PIXI.Text(text, styles.style_function);
            message.resolution = 2
            message.position.set(relative_position_x, _render_state.lastY);
            state.viewport.addChild(message);
            _render_state.perf.new_text()
          }

          _render_state.lastX += time_diff + 1
        }
      },
      scope_to_method: function(start_event: CodeEvent, end_event: CodeEvent) {
        // this.demo_animation(prev)
        let self = this
        _render_state = new RenderState()
        _render_state.will_start_from(start_event.ts)
        state.viewport.removeChildren()


        let start_from = global_state.command_buffer.indexOf(start_event)
        let stop_at = global_state.command_buffer.indexOf(end_event)
        console.log('start_from', start_from, 'stop_at', stop_at)

        let end_ts = end_event.ts
        let total_time_here = end_ts - _render_state.start_ts
        let multiplier = 5
        state.scale_factor = state.win_size.width / total_time_here * multiplier
        for (let current_index = start_from; current_index <= stop_at; current_index++) {
          this.draw_single_event(current_index, self)
        }

        let tres = 200
        state.viewport.resize(
          state.win_size.width,
          state.win_size.height,
          total_time_here * state.scale_factor + tres,
          _render_state.max_y + tres)
        state.viewport.clamp({direction: 'all'})
        state.viewport.clampZoom({
          direction: 'all',
          maxWidth: (total_time_here * state.scale_factor) + tres,
          minHeight: 20
        })
        state.viewport.fit()

        this.draw_needle()
      },
      draw_timeline: function () {
        let viewport = state.viewport
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

        let total_marks = Math.round(last_timestamp / 1000)

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
      initialize_and_draw: function () {
        let self = this
        this.initialize_pixi_renderer()

        if (global_state.command_buffer.length <= 0) {
          return
        }

        this.render_event_graph(self)
        this.draw_grid()

        this.draw_timeline()

        this.draw_needle()
      },
      draw_needle () {
        if (!this.selected_event) {
          return
        }
        let needle_ts = (this.selected_event.ts - _render_state.start_ts) * state.scale_factor

        function create_needle () {
          let needle = new PIXI.Graphics();
          state.viewport.addChild(needle);
          let needle_top = -30
          needle.position.set(0, needle_top);
          let x = needle_ts //ms
          needle.lineStyle(1, 0xDE3249, 0.8)
            .moveTo(x, -20)
            .lineTo(x, 2000);

          needle.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
          needle.beginFill(0xDE3249, 1);
          let needle_circle_radius = 8
          needle.drawCircle(x, needle_top + needle_circle_radius / 2, needle_circle_radius);
          needle.endFill();

          state.needle = needle
        }

        if (!state.needle) {
          create_needle()
        } else {
            state.viewport.removeChild(state.needle)
            create_needle()
        }
      },
      initialize_pixi_renderer: function () {
        state.size = new Size(1000, 1000)
        state.win_size = new Size(window.innerWidth, window.innerHeight)
        this.$refs.js_pixie_container.addEventListener('wheel', e => {
          e.preventDefault()
        }, {passive: false})
        var app = new PIXI.Application(
          {
            // forceCanvas: true,
            antialias: true,
            width: state.win_size.width,
            height: state.win_size.height
          });
        let viewport = new Viewport({
          screenWidth: state.win_size.width,
          screenHeight: state.win_size.height,
          worldWidth: state.size.width,
          worldHeight: state.size.height,
          // noTicker: true,
          divWheel: this.$refs.js_pixie_container,
          interaction: app.renderer.interaction
        });
        state.viewport = viewport

        this.$refs.js_pixie_container.appendChild(app.view);

        app.stage.addChild(viewport);
        state.stage = app.stage
        state.app = app
        viewport
          .drag({wheel: true})
          .pinch()
          .wheel()
          .decelerate();

      },
      should_draw_text: function (time_diff, microseconds) {
        return time_diff > microseconds
      },

      render_event_graph: function(self) {
        let max_y: number = 0
        let lastX = 0
        let lastY = 0
        let stack = []
        let total_boxes = 0
        let total_text_boxes = 0
        state.scale_factor = 1


        for (let current_index in global_state.command_buffer) {
          if (!global_state.command_buffer.hasOwnProperty(current_index)) {
            continue
          }
          let current: CodeEvent = global_state.event_at(current_index)

          if (current.event_name === 'method_enter') {
            stack.push(new EventWithId(current, current_index))
          }
          if (current.event_name === 'method_exit') {
            let previous_stack: EventWithId = stack.pop()
            let previous = previous_stack.event
            let sprite = state.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            //todo same function must have same color

            let time_diff = (current.ts - previous.ts) * state.scale_factor
            let original_color = _colors.for_file_method(current.cursor.file, current.cursor.function_name, time_diff)
            sprite.tint = original_color;

            sprite.width = time_diff
            sprite.height = box_h
            lastY = (stack.length * box_h + 2)
            if (max_y < lastY) {
              max_y = lastY
            }

            sprite.position.set(previous.ts, lastY);
            window.__Color = Color
            sprite.interactive = true;
            // hit area is relative to parent sprite
            sprite.hitArea = new PIXI.Rectangle(0, 0, time_diff, box_h);
            sprite.on('mouseover', (event) => {
              self.is_mouse_over_frame = true
              self.current_frame = current
              sprite.tint = styles.hover_color
              // console.log(current)
            });
            sprite.on('mouseout', (event) => {
              self.is_mouse_over_frame = false
              self.current_frame = null
              sprite.tint = original_color
              // console.log(current)
            });
            sprite.on('click', (event) => {
              if (event.data.originalEvent.metaKey) {
                   this.scope_to_method(previous, current)
              //  scope to event
                   return
              }
              // go to event
              // method start
              let target_index = previous_stack.index
              if (event.data.originalEvent.shiftKey) {
                // or method end
                target_index = current_index
              }

              self.selected_index_will_change(Number.parseInt(target_index))
            });
            total_boxes++
            let microseconds = 50
            // todo use pixi TextMetrics
            if (self.should_draw_text(time_diff, microseconds)) {
              let skip_filename = false
              if (stack.length > 0) {
                let upper_frame: EventWithId = stack[stack.length-1];
                if (upper_frame.event.cursor.file === current.cursor.file) {
                  skip_filename = true
                }

              }
              let text
              if (!skip_filename) {
                text = this.short_filename(current.cursor.file, 1) +  ':' + current.cursor.function_name
              } else {
                text = current.cursor.function_name + '()'
              }

              // let color = Color(sprite.tint)
              // text = color.hex() + ' -> ' + color.hsl().string(0)
              let message = new PIXI.Text(text, styles.style_function);
              message.resolution = 2
              message.position.set(previous.ts, lastY);
              state.viewport.addChild(message);
              total_text_boxes++

            }
            lastX += time_diff + 1

          }
        }
        let message = new PIXI.Text(" total_boxes " + total_boxes, styles.style);
        message.position.set(0, -60);
        state.viewport.addChild(message);
        let message2 = new PIXI.Text("total_text_boxes " + total_text_boxes, styles.style);
        message2.position.set(0, -120);
        state.viewport.addChild(message2);

        let last_timestamp = global_state.command_buffer[global_state.command_buffer.length - 1].ts
        let tres = 200

        state.viewport.resize(
          state.win_size.width,
          state.win_size.height,
          last_timestamp + tres,
          max_y + tres)
        state.viewport.clamp({direction: 'all'})
        state.viewport.clampZoom({
          direction: 'all',
          maxWidth: last_timestamp + tres,
          minHeight: 20
        })
        state.viewport.fit()
      },
      draw_grid () {

        var landscapeTexture = PIXI.Texture.from('/grid10x10.png')

// crop the texture to show just 100 px
        let last_known = 0
        let worldWidth = state.viewport.worldWidth
        console.log(worldWidth)
        while (last_known <= worldWidth) {
          var texture2 = new PIXI.Texture(landscapeTexture, new PIXI.Rectangle(0,0 , 1000, 1000));
          var background = new PIXI.Sprite(texture2);
          background.position.x = last_known;
          let dimensions = 1000 * state.scale_factor
          background.width = dimensions
          background.height = dimensions
          background.position.y = 0;
          last_known+= dimensions
          state.viewport.addChildAt( background, 0 );
        }
      }
    },
    mounted (): void {
      this.initialize_and_draw()

    },
    computed: {
      ...mapGetters(['short_filename','is_panel_visible']),
      ...mapState(['selected_event']),
    },
  }
</script>
<style scoped lang="scss">
  @import "../../styles/colors";
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