// @flow
import {Point} from './webgl/primitives'

export function rgba (r: number, g: number, b: number, a: number) {
  return [
    r,
    g,
    b,
    a
  ]
}
export function rgb (r: number, g: number, b: number) {
  return rgba(r,g,b,1)
}

export function sequence (count: number) {
  let arr =[]
  for (let i = 0; i < count; i++){
    arr.push(i)

  }
  console.log(arr)
  return arr
}

export function p (x: number, y: number) : Point {
  return new Point(x, y)
}
