// @flow
import {CodeEvent, StackFrame} from './models'
import {FileWithId} from './protobuf_message_parsing'

class global {
  entire_command_buffer: Array<CodeEvent> = []
  command_buffer: Array<CodeEvent> = []
  all_stacks: Array<StackFrame> = []
  files: Array<string> = []
  event_at(index: number) : CodeEvent {
    return this.command_buffer[index]
  }

  file_at(index: number) : string {
    return this.files[index]
  }
}

let global1 = new global()
window.global_state = global1
let toConsole = function() {
  window.global_state.command_buffer.forEach((_, i) => console.log( '#'+i+ ': ' + Math.round((_.ts + Number.EPSILON) * 100) / 100  + ' ms'))
}
window.global_state.to_console = toConsole
// some test code
// let count = 1
// window.global_state.entire_command_buffer.forEach(value => {
//   if (value.event_name === 'method_enter') {
//     count++
//   }
// })
export default global1
