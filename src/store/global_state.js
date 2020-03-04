// @flow
import {CodeEvent, StackFrame} from './models'

class global {
  entire_command_buffer: Array<CodeEvent> = []
  command_buffer: Array<CodeEvent> = []
  all_stacks: Array<StackFrame> = []

}

export default new global()
