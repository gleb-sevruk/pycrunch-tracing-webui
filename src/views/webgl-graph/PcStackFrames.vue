<template>
  <div class="pixie--root fixed-bottom">
    <div class="bg-apple-gray-5" v-if="is_panel_visible('stack-graph.render_stats')">{{display_render_state}}</div>
    <div v-if="is_panel_visible('stack-graph.tooltip') && is_mouse_over_frame"
         class="stack-overlay-tooltip fixed-top bg-apple-gray-2" >
      {{current_frame.cursor.function_name}}, {{file_from_id(current_frame.cursor.file)}}
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
  import {EventBus} from '../../shared/event-bus'
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
    // start and end event from which timeline is drawn
    span: MethodSpan = null

    is_scoped() : boolean {
      return this.span !== null
    }

    will_scope_to (start: CodeEvent, end: CodeEvent) {
      let no_need_for = 0
      this.span = new MethodSpan(new EventWithId(start, no_need_for), new EventWithId(end, no_need_for))
    }

    will_exit_scope() {
      this.span = null
    }
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
  const treshold = 200

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
    end_ts: number = 0
    global_offset: number = 0
    viewport : Size = null
    will_start_from (ts: number) {
      this.start_ts = ts
    }
    will_end_at (ts: number) {
      this.end_ts = ts
    }
    adjust_global_offset(number_of_vertical_boxes: number) {
      this.global_offset = number_of_vertical_boxes * box_h + 2
    }
    recalculate_last_y_based_on_stack_depth () {
      this.lastY = this.global_offset + this.stack.length * box_h + 2
      if (this.max_y < this.lastY) {
        this.max_y = this.lastY
      }
    }
    should_draw_text (time_diff: number) {
      let microseconds = 50
      return time_diff > microseconds
    }
    viewport_size_will_change(width: number, height: number) {
      this.viewport =new Size(width, height)
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
        display_render_state: {
          world_size: {
            width: null,
            height: null,
          },
          visible_area: {
            x: null,
            y: null,
            width: null,
            height: null,
            scale: null,
          }

        }
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
      draw_span: function (span, self, in_span: MethodSpan = null) {
        let sprite = state.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));

        let time_diff = (span.end.event.ts - span.start.event.ts) * state.scale_factor
        let original_color = _colors.for_file_method(global_state.file_at(span.end.event.cursor.file), span.end.event.cursor.function_name, time_diff)
        sprite.tint = original_color;
        if (!in_span) {
          sprite.width = time_diff
        }
        else {
          sprite.width = (in_span.end.event.ts) * state.scale_factor
        }
        sprite.height = box_h

        _render_state.recalculate_last_y_based_on_stack_depth()
        let relative_position_x
        if (!in_span){
          relative_position_x = (span.start.event.ts - _render_state.start_ts) * state.scale_factor
        } else {
          relative_position_x = 0

        }
        sprite.position.set(relative_position_x, _render_state.lastY);

        sprite.interactive = true;
        // hit area is relative to parent sprite
        sprite.hitArea = new PIXI.Rectangle(0, 0, time_diff, box_h);

        sprite.on('mouseover', (event) => {
          self.is_mouse_over_frame = true
          self.current_frame = span.end.event
          sprite.tint = styles.hover_color
        });
        sprite.on('mouseout', (event) => {
          self.is_mouse_over_frame = false
          self.current_frame = null
          sprite.tint = original_color
        });
        sprite.on('click', (event) => {
          if (event.data.originalEvent.metaKey) {
            this.scope_to_method(span.start.event, span.end.event, self)
            this.invalidate_viewport_configuration()
            // state.viewport.fit()
            return
          }
          // go to event
          // method start
          let target_index = span.start.index
          if (event.data.originalEvent.shiftKey) {
            // or method end
            target_index = span.end.index
          }

          self.selected_index_will_change(Number.parseInt(target_index))
        });
        _render_state.perf.new_box()


        // todo use pixi TextMetrics
        if (_render_state.should_draw_text(time_diff)) {
          let skip_filename = false
          if (_render_state.stack.length > 0) {
            let upper_frame: EventWithId = _render_state.stack[_render_state.stack.length - 1];
            if (upper_frame.event.cursor.file === span.end.event.cursor.file) {
              skip_filename = true
            }
          }
          let text
          if (!skip_filename) {

            text = this.short_filename(global_state.file_at(span.end.event.cursor.file), 1) + ':' + span.end.event.cursor.function_name
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
          self.draw_span(span, self)
        }
      },
      invalidate_display_stats: function () {
        this.display_render_state.world_size.width = _render_state.viewport.width + treshold
        this.display_render_state.world_size.height = _render_state.viewport.height + treshold
        let visibleBounds = state.viewport.getVisibleBounds()
        this.display_render_state.visible_area.width = visibleBounds.width
        this.display_render_state.visible_area.height = visibleBounds.height
        this.display_render_state.visible_area.x = visibleBounds.x
        this.display_render_state.visible_area.y = visibleBounds.y
        this.display_render_state.visible_area.scale = state.viewport.scale.x

      },
      invalidate_viewport_configuration: function () {
        state.viewport.resize(
          state.win_size.width,
          state.win_size.height,
          _render_state.viewport.width + treshold,
          _render_state.viewport.height  + treshold
        )
        state.viewport.clamp({direction: 'all'})
        state.viewport.clampZoom({
          direction: 'all',
          maxWidth: _render_state.viewport.width + treshold,
          minHeight: 80,
          // maxHeight: _render_state.viewport.height * 3 + treshold
        })

        this.invalidate_display_stats()
      },
      collect_outer_stack: function (until: number, trail_starts_from: number) : Array<MethodSpan> {
        let results: Array<MethodSpan> = []
        let stack: Array<number, CodeEvent> = []
        for (let current_index = 0; current_index < until; current_index++) {
          if (!global_state.command_buffer.hasOwnProperty(current_index)) {
            continue
          }

          let current: CodeEvent = global_state.event_at(current_index)
          if (current.event_name === 'method_enter') {
            stack.push(new EventWithId(current, current_index))
          }
          if (current.event_name === 'method_exit') {
            stack.pop()
          }
        }

        let ends_at = global_state.command_buffer.length
        let tail_stack: Array<number, CodeEvent> = []

        for (let current_index = trail_starts_from + 1; current_index < ends_at; current_index++) {
          if (!global_state.command_buffer.hasOwnProperty(current_index)) {
            continue
          }

          let current: CodeEvent = global_state.event_at(current_index)
          if (current.event_name === 'method_enter') {
            tail_stack.push(new EventWithId(current, current_index))
          }
          if (current.event_name === 'method_exit') {
            if (tail_stack.length > 0) {
              tail_stack.pop()
              continue
            }
            else {
              let span: MethodSpan = null
              let staring_event = stack.pop()
              span = new MethodSpan(staring_event, new EventWithId(current, current_index))
              results.push(span)
            }

          }
        }
        return results

      },
      scope_to_method: function(start_event: CodeEvent, end_event: CodeEvent, self) {
        // this.demo_animation(prev)
        _render_state = new RenderState()
        _render_state.will_start_from(start_event.ts)
        state.viewport.removeChildren()
        state.will_scope_to(start_event, end_event)

        let start_from = global_state.command_buffer.indexOf(start_event)
        let stop_at = global_state.command_buffer.indexOf(end_event)
        console.log('start_from', start_from, 'stop_at', stop_at)

        let end_ts = end_event.ts
        let total_time_here = end_ts - _render_state.start_ts
        let multiplier = 5
        state.scale_factor = state.win_size.width / total_time_here * multiplier
        let stack = this.collect_outer_stack(start_from, stop_at)

        console.log('stack', stack)
        let total_global_offset = 0
        while (stack.length > 0) {
          let current_span = stack.pop()
          self.draw_span(current_span, self, new MethodSpan(
            new EventWithId(start_event, start_from),
            new EventWithId(end_event, stop_at)),
          )
          total_global_offset += 1
          _render_state.adjust_global_offset(total_global_offset)
        }
        for (let current_index = start_from; current_index <= stop_at; current_index++) {
          this.draw_single_event(current_index, self)
        }
        _render_state.viewport_size_will_change(total_time_here * state.scale_factor, _render_state.max_y +  _render_state.global_offset)
        this.draw_stats()

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
      redraw_all: function (self) {
        this.render_event_graph(self)
        this.draw_grid()

        this.draw_timeline()

        this.draw_needle()
        this.invalidate_viewport_configuration()
        state.viewport.fit()
      },
      initialize_and_draw: function () {
        let self = this
        this.initialize_pixi_renderer()

        if (global_state.command_buffer.length <= 0) {
          return
        }
        this.redraw_all(self)
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
        let self = this
        state.size = new Size(1000, 1000)
        state.win_size = new Size(window.innerWidth, window.innerHeight)  // 50vh
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

        viewport.on('drag-end', () => {
          self.invalidate_display_stats()
        })
        viewport.on('zoomed-end', () => {
          self.invalidate_display_stats()
        })
      },
      should_draw_text: function (time_diff, microseconds) {
        return time_diff > microseconds
      },

      draw_stats: function () {
        let message = new PIXI.Text(" total_boxes " + _render_state.perf.total_boxes, styles.style);
        message.position.set(0, -60);
        state.viewport.addChild(message);
        let message2 = new PIXI.Text("total_text_boxes " + _render_state.perf.total_text_boxes, styles.style);
        message2.position.set(0, -120);
        state.viewport.addChild(message2);
      },
      render_event_graph: function(self) {
        _render_state = new RenderState()
        _render_state.will_start_from(0)
        state.viewport.removeChildren()

        state.will_exit_scope()
        state.scale_factor = 1

        for (let current_index in global_state.command_buffer) {
          if (!global_state.command_buffer.hasOwnProperty(current_index)) {
            continue
          }

          this.draw_single_event(current_index, self)
        }
        this.draw_stats()

        let last_timestamp = global_state.command_buffer[global_state.command_buffer.length - 1].ts
        _render_state.viewport_size_will_change(last_timestamp, _render_state.max_y)

      },
      draw_grid () {

        var landscapeTexture = PIXI.Texture.from('/grid10x10.png')

// crop the texture to show just 100 px
        let last_known = 0
        let worldWidth = state.viewport.worldWidth
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
      let self = this
      EventBus.$on('display_events_did_update', payload => {
        state.app.ticker.stop()
        if (state.is_scoped()) {
          this.scope_to_method(state.span.start.event, state.span.end.event, self)

        } else {
          this.render_event_graph(self)
        }

        state.app.ticker.start()

      });

      this.initialize_and_draw()

    },
    computed: {
      ...mapGetters(['short_filename','is_panel_visible', 'file_from_id']),
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