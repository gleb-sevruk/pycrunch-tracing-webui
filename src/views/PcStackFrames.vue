<template>
  <div class="pixie--root fixed-bottom">
    <div ref="js_pixie_container"  class="pixie--container">

    </div>
  </div>
</template>
<script>
  import * as PIXI from 'pixi.js'
  import { Viewport } from 'pixi-viewport'
  import {CodeEvent} from '../store/models'

  export default {
    name: 'pc-stack-frames',
    mounted (): void {
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

        interaction: app.renderer.interaction // the interaction module is important for wheel() to work properly when renderer.view is placed or scaled
      });

// add the viewport to the stage

      this.$refs.js_pixie_container.appendChild(app.view);
      app.stage.addChild(viewport);

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
      let lastX = 0
      let lastY = 0
      let stack = []
      let total_boxes = 0
      for (let i in global_state.command_buffer) {
        if (!global_state.command_buffer.hasOwnProperty(i)) {
          continue
        }
        let current: CodeEvent = global_state.command_buffer[i]

        if (current.event_name === 'method_enter') {
          stack.push(current)
          // console.log('lastX', lastX)

        }
        if (current.event_name === 'method_exit') {
          let previous = stack.pop()
          let sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
          //todo same function must have same color
          sprite.tint = 0xff0000 - i * 1000;

          let box_w = current.ts - previous.ts
          sprite.width = box_w
          let box_h = 20
          sprite.height = box_h
          lastY = stack.length * box_h + 2
          sprite.position.set(previous.ts, lastY);
          total_boxes++
          // let message = new PIXI.Text(Math.round(current.ts) + " " +Math.round(lastX) +':' + Math.round(lastY) , style);
          // message.position.set(previous.ts, lastY);
          // viewport.addChild(message);

          lastX += box_w + 1
        }
      }
      let message = new PIXI.Text(" total_boxes " +total_boxes , style);
      message.position.set(0, -60);
      viewport.addChild(message);



    }
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
</style>