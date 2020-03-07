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

function event_at (attempt_index) {
  return global_state.command_buffer[attempt_index]
}

export function seek_step_out_backwards (event_under_cursor: CodeEvent, current_index: number): number {
  // console.group('seek_step_out_backwards')
  // console.table({current_index, event_under_cursor})
  let found_exit = false
  let target_index = current_index - 1
  let attempt_event : CodeEvent = event_at(target_index)
  let total = global_state.command_buffer.length
  if (event_under_cursor.event_name !== 'method_enter') {
    let depth_stack = []
    // console.log('!== method_enter')

    while (!found_exit && target_index > 1 ) {
      // console.log('while, current', attempt_event.event_name)
      attempt_event = event_at(target_index)
      if (attempt_event.event_name === 'method_exit') {
        // console.log('attempt_event = method_exit', target_index)
        depth_stack.push(target_index)
      }
      if (attempt_event.event_name === 'method_enter') {
        // console.log('attempt_event = method_enter', target_index)
        if (depth_stack.length === 0) {
          found_exit = true
          target_index -= 1
          break
        } else {
          depth_stack.pop()
        }

      }
      target_index -= 1


    }
  }
  // console.groupEnd()

  return target_index
}

export function seek_step_out_forward (event_under_cursor: CodeEvent, current_index: number) {
  // console.group('seek_step_out_forward')
  // console.table({current_index, event_under_cursor})
  let found_exit = false
  let target_index = current_index +1
  let attempt_event : CodeEvent = event_at(target_index)
  let total = global_state.command_buffer.length
  if (event_under_cursor.event_name !== 'method_exit') {
    let depth_stack = []
    // console.log('!== method_exit')

    while (!found_exit && target_index < total ) {
      // console.log('while, current', attempt_event.event_name)
      attempt_event = event_at(target_index)
      if (attempt_event.event_name === 'method_enter') {
        // console.log('attempt_event = method_enter', target_index)
        depth_stack.push(target_index)
      }
      if (attempt_event.event_name === 'method_exit') {
        // console.log('attempt_event = method_exit', target_index)
        if (depth_stack.length === 0) {
          found_exit = true
          // target_index += 1
        } else {
          depth_stack.pop()
        }

      }
      target_index += 1


    }
  }
  // console.groupEnd()

  return target_index
}

export function seek_back_in_current_method (evt: CodeEvent, attempt_index: number) : number{
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