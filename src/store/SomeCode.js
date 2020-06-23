// @flow

class Marker {
  // marker will have information about its method

  line_number: number
  method_context: MethodCall
  outgoing_call: MethodCall
  is_return : boolean
}

class MethodCall {
  typescript_is: string = 'no good'
  file_name : string
  method_name : string
  markers : Array<Marker> = []

  whats_up (): string {

    return 'test = ' + this.typescript_is
  }
}

console.log((new MethodCall()).whats_up())

export function create_demo_data (): MethodCall {
  let methodCall = new MethodCall()
  methodCall.method_name = 'a'
  methodCall.file_name = 'dermo.py'

  function create_marker (line_number: number) {
    let marker = new Marker()
    marker.line_number = line_number
    marker.method_context = methodCall
    return marker
  }



  methodCall.markers.push(create_marker(1))
  methodCall.markers.push(create_marker(2))
  methodCall.markers.push(create_marker(3))
  let marker_with_call = create_marker(4)

  let outgoing_call =   new MethodCall()
  outgoing_call.method_name = 'b'
  outgoing_call.file_name = 'another_dermo.py'

  marker_with_call.outgoing_call = outgoing_call
  methodCall.markers.push(marker_with_call)
  return methodCall
}
