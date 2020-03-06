
export class ExecutionCursor {
  line: number
  file: string
}

export class StackFrame {
  id: number
  line: number
  file: string

  parent_id: number

  constructor (id: number, file: string, line: number, parent_id: number) {
    this.id = id
    this.file = file
    this.line = line
    this.parent_id = parent_id
  }
}

export class CodeFile {
  filename: string
  contents: string
}

export class Variable {
  name: string
  value: string

  constructor (name: string, value: string) {
    this.name = name
    this.value = value
  }
}

export class CodeEvent {
  event_name : string
  stack_id : number
  cursor: ExecutionCursor
  locals: Variables

  constructor (event_name: string,
               cursor: ExecutionCursor,
               stack_id: number,
               locals: Array<Variable>,
               input_variables: Array<Variable>,
               return_variables: Array<Variable>
  ) {
    this.event_name = event_name
    this.cursor = cursor
    this.stack_id = stack_id
    this.locals = locals
    this.input_variables = input_variables
    this.return_variables = return_variables

  }

}

export class LiveTracker {
  sid: string
  version: string

  constructor (sid, version: string) {
    this.sid = sid
    this.version = version
  }
}

function default_widgets (): Array<UiWidget> {
  let array = []
  function add_widget (name) {
    array.push(new UiWidget(name))
  }

  add_widget('main.filename')
  add_widget('widgets.inspector')
  add_widget('toolbar.surface')
  add_widget('main.sidebar')
  add_widget('main.ignored_files')
    add_widget('inspector.stack')

  return array
}

export class UiWidget {
  name: string
  is_visible: boolean
  configuration: any

  constructor (name: string) {
    this.name = name
    this.is_visible = true
  }
}


export class UiState {
  panels: Array<UiWidget> = default_widgets()
  follow_cursor: boolean = true
  file_filters: Array<string> = []

  ignore_file (filename: string) {
    console.log(filename)
    if (this.file_filters.indexOf(filename) < 0) {
      this.file_filters.push(filename)
    }
  }

  unignore_file (filename: string) {
    console.log(filename)
    let indexOf = this.file_filters.indexOf(filename)
    if (indexOf >= 0) {
      this.file_filters.splice(indexOf, 1)
    }
  }

  is_filtered (command: CodeEvent) {
    // debugger
    let file = command.cursor.file
    return this.file_filters.indexOf(file) >= 0
  }

  is_panel_visible (panel: string) {
    let optional: ?UiWidget = this.panels.find((_: UiWidget) => _.name === panel)
    if (optional) {
      return optional.is_visible
    }
  }

  toggle_panel (panel: string) {
    let optional: ?UiWidget = this.panels.find((_: UiWidget) => _.name === panel)
    if (optional) {
      optional.is_visible = !optional.is_visible
    }
  }

}

export class TracingSession {
  name: string
  metadata: any
  short_name: string
}

export class ProfileDetails {
  profile_name: string
  exclusions: Array<string>
}