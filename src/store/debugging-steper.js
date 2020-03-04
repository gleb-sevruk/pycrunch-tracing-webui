import global_state from './global_state'
import {CodeEvent} from './models'

export function step_over_from_current_event (evt: CodeEvent, attempt_index: number) {
  let found_exit = false
  let depth_stack = []
  // seek forward
  if (evt.event_name === 'method_enter') {
    depth_stack.push(attempt_index)
    //  |
    //  ->
    //    ->
    //    <-
    //  <-
    while (!found_exit) {
      attempt_index += 1
      let next_event = global_state.command_buffer[attempt_index]
      if (next_event.event_name === 'method_enter') {
        depth_stack.push(attempt_index)
      }
      if (next_event.event_name === 'method_exit') {
        depth_stack.pop()
        if (depth_stack.length === 0) {
          found_exit = true
          attempt_index += 1
        }
      }
    }
    //  skip to 'method_exit'
  }
  return attempt_index
}

export function seek_back_in_current_method (evt: CodeEvent, attempt_index: number) {
  let found_exit = false
  let depth_stack = []
  if (evt.event_name === 'method_exit') {
    // we are going deeper back
    depth_stack.push(attempt_index)
    //  |
    //  ->
    //    ->
    //    <-
    //  <-
    while (!found_exit) {
      attempt_index -= 1
      let next_event = global_state.command_buffer[attempt_index]
      if (next_event.event_name === 'method_exit') {
        depth_stack.push(attempt_index)
      }
      if (next_event.event_name === 'method_enter') {
        depth_stack.pop()
        if (depth_stack.length === 0) {
          found_exit = true
          attempt_index -= 1
        }
      }
    }
    //  skip to 'method_enter - 1'

  }
  return attempt_index
}