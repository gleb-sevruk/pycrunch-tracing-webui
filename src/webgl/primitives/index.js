import * as REGL from 'regl'
import {p} from '../../utils'

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

  flat (): Array<number> {
    return [this.x, this.y]
  }
}

export class PrimitivesFactory {
  regl: REGL.Regl

  constructor (regl: REGL.Regl) {
    this.regl = regl
  }

  createTriangle (a: Point, b: Point, c: Point) {
    return {
      frag: shader_frag,

      vert: shader_vert_tri_with_transform,
      attributes: {
        a_position: this.regl.buffer([
          a.flat(),
          b.flat(),
          c.flat(),
        ]),
      },

      uniforms: {
        u_color: this.regl.prop('u_color'),
        u_transform: this.regl.prop('u_transform'),
      },

      // This tells regl the number of vertices to draw in this command
      count: 3,
    }
  }

  createRect (a: Point, b: Point, c: Point, d: Point) {
    // noinspection JSSuspiciousNameCombination
    // let right = left + width
    // let bottom = top + height
    // noinspection JSSuspiciousNameCombination
    let tris_one = [
      a.flat(),
      c.flat(),
      b.flat(),
    ]
    let tris_two = [
      a.flat(),
      d.flat(),
      c.flat(),
    ]
    return {
      frag: shader_frag,
      vert: shader_vert_tri_with_transform,
      attributes: {
        a_position: this.regl.buffer([
          ...tris_one,
          ...tris_two,
        ]),
      },

      uniforms: {
        u_color: this.regl.prop('u_color'),
        // u_transform: this.regl.prop('u_transform'),
      },

      // This tells regl the number of vertices to draw in this command
      count: 6,
    }
  }
}

export class Rect {
  a: Point
  b: Point
  c: Point
  d: Point

  static create (left, top, width, height) {
    //  in canvas coordinates [-1..1]
    let right = left + width
    let bottom = top + height
    let result = new Rect()

    result.a = screen.toSurface(p(left, top))
    result.b = screen.toSurface(p(right, top))
    result.c = screen.toSurface(p(right, bottom))
    result.d = screen.toSurface(p(left, bottom))
    return result
  }

  toCanvasChords(screen : Screen) {
    let result = new Rect()

    result.a = screen.toSurface(this.a)
    result.b = screen.toSurface(this.b)
    result.c = screen.toSurface(this.c)
    result.d = screen.toSurface(this.d)
    return result
  }
}


