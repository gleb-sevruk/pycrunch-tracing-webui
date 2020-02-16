//@flow
export class SceneObject {
  regl_task : any
  uniform_parameters : Object

  constructor (regl_task : any, uniform_parameters : Object) {
    this.regl_task = regl_task
    this.uniform_parameters = uniform_parameters

  }
}

export class Batch {
  primitives : Array<SceneObject>

  add(primitive: any, draw_uniform_parameters: Object) {
    this.primitives.push(new SceneObject(primitive, draw_uniform_parameters))
  }

}