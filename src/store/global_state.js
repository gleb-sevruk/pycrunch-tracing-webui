// @flow
import {CodeEvent, StackFrame} from './models'

class global {
  entire_command_buffer: Array<CodeEvent> = []
  command_buffer: Array<CodeEvent> = []
  all_stacks: Array<StackFrame> = []
  event_at(index: number) : CodeEvent {
    return this.command_buffer[index]
  }
}

let global1 = new global()
window.global_state = global1
// some test code
// let count = 1
// window.global_state.entire_command_buffer.forEach(value => {
//   if (value.event_name === 'method_enter') {
//     count++
//   }
// })
export default global1
