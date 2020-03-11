import * as PIXI from 'pixi.js'
let Color = require('color')

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
let style_pidr = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 18,
  fill: "#006900",

});

let hoverColor = Color("#279f00").rgbNumber()
export default  {
  style_function: style_function,
  style: style,
  style_pidr: style_pidr,
  hover_color: hoverColor
}
