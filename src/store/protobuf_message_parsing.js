// @flow
import {CodeEvent, ExecutionCursor, StackFrame, Variable} from './models'

let goog = require('google-protobuf');
let messages = require("../proto/message_pb")

class ParsedTimeline {
  stacks: Array<StackFrame> = []
  command_buffer: Array<CodeEvent> = []
}

export function parse_protobuf_datastream (payload: any): ParsedTimeline {
  let parsed = new ParsedTimeline()

  let xx = messages.TraceSession.deserializeBinary(payload)
  let events = xx.getEventsList()

  let back_buffer = []
  events.forEach(_ => {
    let cursor_pb = _.getCursor()
    let cursor = new ExecutionCursor()
    cursor.file = cursor_pb.getFile()
    cursor.line = cursor_pb.getLine()
    cursor.function_name = cursor_pb.getFunctionName()
    let all_locals = []
    let locals = _.getLocals()
    if (locals) {
      let list = locals.getVariablesList()
      list.forEach(__ => {
        all_locals.push(new Variable(__.getName(), __.getValue()))
      })
    }

    let all_input = []
    let input = _.getInputVariables()
    if (input) {
      let list = input.getVariablesList()
      list.forEach(__ => {
        all_input.push(new Variable(__.getName(), __.getValue()))
      })
    }
    let all_returns = []
    let return_vars = _.getReturnVariables()
    if (return_vars) {
      let list = return_vars.getVariablesList()
      list.forEach(__ => {
        all_returns.push(new Variable(__.getName(), __.getValue()))
      })
    }
    let x = new CodeEvent(_.getEventName(),  cursor, _.getStackId(), all_locals, all_input, all_returns, _.getTs())
    back_buffer.push(x)
  })
  let back_stack = []
  parsed.stacks.length = 0

  let stacks = xx.getStackFramesList()
  stacks.forEach(_ => {
    let x = new StackFrame(
      _.getId(),
      _.getFile(),
      _.getLine(),
      _.getParentId(),
      _.getFunctionName(),
      )
    back_stack.push(x)
  })

  parsed.command_buffer = [...back_buffer]
  parsed.stacks = [...back_stack]
  return parsed
}