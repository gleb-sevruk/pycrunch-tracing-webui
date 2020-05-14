export class ExecutionCursor {
  line: number
  file: string
  function_name: string
}

export class StackFrame {
  id: number
  line: number
  file: string
  function_name: string

  parent_id: number

  constructor (id: number,
               file: string,
               line: number,
               parent_id: number,
               function_name: string) {
    this.id = id
    this.file = file
    this.line = line
    this.parent_id = parent_id
    this.function_name = function_name
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
  ts: number
  constructor (event_name: string,
               cursor: ExecutionCursor,
               stack_id: number,
               locals: Array<Variable>,
               input_variables: Array<Variable>,
               return_variables: Array<Variable>,
               ts: number
  ) {
    this.event_name = event_name
    this.cursor = cursor
    this.stack_id = stack_id
    this.locals = locals
    this.input_variables = input_variables
    this.return_variables = return_variables
    this.ts = ts

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
  function add_widget (name: string, enabled: boolean = true) {
    let uiWidget = new UiWidget(name)
    uiWidget.is_visible = enabled
    array.push(uiWidget)
  }

  add_widget('main.filename')
  add_widget('widgets.inspector')
  add_widget('toolbar.surface')
  add_widget('main.sidebar')
  add_widget('main.ignored_files')
  add_widget('inspector.stack')
  add_widget('inspector.variables')
  add_widget('main.stack-frames', false)
  add_widget('stack-graph.tooltip', true)
  add_widget('stack-graph.render_stats', true)

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
  folder_filters: Array<string> = []

  ignore_file (filename: string) {
    console.log(filename)
    if (this.file_filters.indexOf(filename) < 0) {
      this.file_filters.push(filename)
    }
  }
  ignore_folder (folder: string) {
    if (this.folder_filters.indexOf(folder) < 0) {
      this.folder_filters.push(folder)
    }
  }

  unignore_folder (folder: string) {
    let indexOf = this.folder_filters.indexOf(folder)
    if (indexOf >= 0) {
      this.folder_filters.splice(indexOf, 1)
    }
  }

  unignore_file (filename: string) {
    let indexOf = this.file_filters.indexOf(filename)
    if (indexOf >= 0) {
      this.file_filters.splice(indexOf, 1)
    }
  }

  is_filtered (command: CodeEvent) {
    // debugger

    let file_id = command.cursor.file
    let file = global_state.file_at(file_id)
    for (let folder in this.folder_filters) {
      if (!this.folder_filters.hasOwnProperty(folder)) {
        continue
      }

      let current_candidate_folder = this.folder_filters[folder]
      if (file.startsWith(current_candidate_folder)) {
        return true
      }
    }

    let is_file_ignored = this.file_filters.indexOf(file_id) >= 0
    return is_file_ignored
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