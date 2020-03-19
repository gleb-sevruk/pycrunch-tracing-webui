<template>
  <div  class="inspector-panel position-fixed elevation-02 bg-apple-gray-5 rounded mt-3  mr-4 p-4">
    <div class="d-flex mb-1">
      <div class="heading" ><span class="text-secondary">Inspector</span></div>
      <el-button type="mini" @click="will_toggle_ui_panel('inspector.variables')" class="elevation-03 bg-apple-gray-3" title="Toggle Variables">V</el-button>
      <el-button type="mini" @click="will_toggle_ui_panel('inspector.stack')" class="elevation-03 bg-apple-gray-3" title="Toggle Stack">S</el-button>
    </div>
    <a v-if="selected_event" :href="'#line' + selected_event.cursor.line">
      <div class="text-monospace small" >
        <span class="text-secondary" >event:</span> {{selected_event.cursor.function_name}}, {{short_filename(selected_event.cursor.file, 2)}} {{selected_event.event_name}}:{{selected_event.cursor.line}}
      </div>
    </a>
    <div v-if="selected_event" title="event timestamp in format ms.microsecs (1 millisecond=1000 microseconds) ">{{selected_event.ts | round(6)}} ms</div>
    <div v-if="is_panel_visible('inspector.variables')" class="locals" >
<!--      <span class="text-secondary">locals</span>-->
      <div class="all-locals" v-if="selected_event">
        <hr/>
        <div v-if="selected_event.event_name === 'line'" class="line">
          <span class="text-secondary">locals</span>
          <pc-variables :variables="selected_event.locals"></pc-variables>
<!--          {{ selected_event.locals}}-->
        </div>
        <div v-if="selected_event.event_name === 'method_exit'" class="method-exit">
          <span class="text-secondary">return arguments</span>
          <pc-variables :variables="selected_event.return_variables"></pc-variables>
          <div class="text-secondary mt-2">locals</div>
          <pc-variables :variables="selected_event.locals"></pc-variables>

          <!--          {{ selected_event.locals}}-->
        </div>
        <div v-if="selected_event.event_name === 'method_enter'" class="method-enter">
          <span class="text-secondary">input arguments</span>
          <pc-variables :variables="selected_event.input_variables"></pc-variables>
          <!--          {{ selected_event.locals}}-->
        </div>

      </div>

    </div>
    <div class="stack" v-if="is_panel_visible('inspector.stack')">
      <hr>
      Stack
<!--      {{entire_frame}}-->
      <div v-if="selected_event" v-for="stack in entire_frame" class="single-stack">
        <code class="text-light">{{stack}}</code>
      </div>
    </div>
  </div>
</template>

<script>
  import {mapGetters, mapMutations, mapState} from 'vuex'
  import PcVariables from './variables.component'
  import global_state from '../../store/global_state'
  import {StackFrame} from '../../store/models'

  export default {
    name: "pc-right-toolbar",
    components: {PcVariables},
    computed: {
      ...mapState(['selected_event',]),
      ...mapGetters([ 'selected_stack', 'is_panel_visible','short_filename']),

      entire_frame() {
        let selected_event = this.selected_event
        let entire_stack = []
        let last_known = null
        let find: StackFrame = global_state.all_stacks.find((_: StackFrame) =>_.id === selected_event.stack_id)
        let self = this
        function stack_frame_to_string (find: StackFrame) {
          if (!find) {
            return 'no data '
          }
          return `${find.function_name}, ${self.short_filename(find.file, 3)}:${find.line}`
        }

        entire_stack.push(stack_frame_to_string(find))

        do {
          if (!find) {
            break
          }
          if (find.parent_id === -1) {
            break
          }
          if (find.parent_id === 0) {
            break
          }
          // debugger
          let deep = global_state.all_stacks.find((_: StackFrame) =>_.id === find.parent_id)
          if (!deep) {
            break
          }
          last_known = deep
          find = deep
          entire_stack.push(stack_frame_to_string(deep))
        }
        while (last_known.parent_id !== -1 || last_known.parent_id !== 0)
        return entire_stack
      }
    },
    methods: {
      ...mapMutations(['will_toggle_ui_panel'])
    },
  }
</script>

<style scoped>
  .stack {
    /*height: 300px;*/
    /*overflow: auto;*/
  }
  .inspector-panel {
    max-height: 80vh;
    width: 48%;
    overflow-y: auto;
  }
</style>