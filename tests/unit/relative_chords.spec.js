import {Screen} from '../../src/positioning'
import {shallowMount} from '@vue/test-utils'
import {Point} from '../../src/primitives'


describe('Screen', () => {
  it('transform 1 to 1', () => {
    let x = new Screen(100,100)
    let p = new Point(50, 100)
    let transformed = x.toSurface(p)
    expect(transformed.x).toBe(0)
    expect(transformed.y).toBe(-1)
  })
})
