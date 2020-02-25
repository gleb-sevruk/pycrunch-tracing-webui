//@flow

import {Point} from '../primitives'

export class Screen {
  width: number
  height: number
  constructor (width: number, height: number) {
    this.width = width
    this.height = height
  }
  stateToConsole() : void {
    console.log('screen: ' + this.width + 'x' + this.height)
  }
  toSurfaceX(left : number) : number {
    let zero_to_one = left / this.width

    let zero_to_two = zero_to_one * 2.0
    let in_clip_space = zero_to_two - 1.0
    console.table({
      screen_width : this.width,
      left,
      zero_to_one,
      zero_to_two,
      in_clip_space
    })
    console.log('left:' + left + '->' + in_clip_space)
    return in_clip_space
  }

  toSurfaceY(top : number) : number {
    let zero_to_one = top / this.height
    let zero_to_two = zero_to_one * 2.0
    let in_clip_space = zero_to_two - 1.0
    console.table({
      screen_height : this.height,
      top,
      zero_to_one,
      zero_to_two,
      in_clip_space
    })
    return -in_clip_space
  }

  toSurface(point : Point) : Point {
  //x' =   -1 .. 1       == [0..width]
  //x' =    0 .. 2 (-1)  == [0..width]
  //y' =   -1 .. 1       == [0..height]

    let x = point.x
    let y = point.y


    let point1 = new Point(this.toSurfaceX(x), this.toSurfaceY(y))
    return point1
  }
}