
import * as REGL from 'regl'
import {p} from '../utils'

// if (process.env.TEST) {
const shader_frag = require('../shaders/simple-triangle/tri-frag.glsl')
const shader_vert_tri = require('../shaders/simple-triangle/tri-vert.glsl')
const shader_vert_circle = require('../shaders/circle-vert.glsl')
const shader_vert_tri_with_transform = require('../shaders/tri-vert-with-transform.glsl')
// }

export class Point {
  x: number
  y: number
  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }

  flat() : Array<number>{
    return [this.x, this.y]
  }
}

export class PrimitivesFactory {
  regl: REGL.Regl
  constructor (regl: REGL.Regl) {
    this.regl = regl
  }
  
  createTriangle (a : Point, b: Point, c: Point) {
    return {
      frag: shader_frag,

      vert: shader_vert_tri_with_transform,
      attributes: {
        a_position: this.regl.buffer([
          a.flat(),
          b.flat(),
          c.flat()
        ])
      },

      uniforms: {
        u_color: this.regl.prop('u_color'),
        u_transform: this.regl.prop('u_transform')
      },

      // This tells regl the number of vertices to draw in this command
      count: 3
    }
  }
  createRect (top : number, right: number, bottom: number, left: number) {
    // noinspection JSSuspiciousNameCombination
    // let right = left + width
    // let bottom = top + height
    // noinspection JSSuspiciousNameCombination
    return {
      frag: shader_frag,

      vert: shader_vert_tri_with_transform,
      attributes: {
        a_position: this.regl.buffer([
          p(left, top).flat(),
          p(right, bottom).flat(),
          p(left, bottom).flat(),

          p(right,top).flat(),
          p(right,bottom).flat(),
          p(left, top).flat(),
        ])
      },

      uniforms: {
        u_color: this.regl.prop('u_color'),
        u_transform: this.regl.prop('u_transform')
      },

      // This tells regl the number of vertices to draw in this command
      count: 6
    }
  }
}


