<template>
  <div  class="position-fixed elevation-02 bg-apple-gray-5 rounded  mt-3  mr-4 p-4">
    <div class="heading"><span class="text-secondary">Inspector</span></div>
    <a :href="'#line' + selected_event.cursor.line">
      <div class="text-monospace small" >
        <span class="text-secondary" >event:</span> {{selected_event.event_name}}:{{selected_event.cursor.line}}
      </div>
    </a>
    <hr/>
    <div class="locals">
<!--      <span class="text-secondary">locals</span>-->
      <div class="all-locals">
        <div v-if="selected_event.event_name === 'line'" class="line">
          <span class="text-secondary">locals</span>
          <pc-variables :variables="selected_event.locals.variables"></pc-variables>
<!--          {{ selected_event.locals}}-->
        </div>
        <div v-if="selected_event.event_name === 'method_exit'" class="method-exit">
          <span class="text-secondary">return arguments</span>
          <pc-variables :variables="selected_event.return_variables.variables"></pc-variables>
          <div class="text-secondary mt-2">locals</div>
          <pc-variables :variables="selected_event.locals.variables"></pc-variables>

          <!--          {{ selected_event.locals}}-->
        </div>
        <div v-if="selected_event.event_name === 'method_enter'" class="method-enter">
          <span class="text-secondary">input arguments</span>
          <pc-variables :variables="selected_event.input_variables.variables"></pc-variables>
          <!--          {{ selected_event.locals}}-->
        </div>

      </div>

    </div>
    <hr>
    <div class="stack">
      Stack
      <div v-for="stack in selected_event.stack" class="single-stack">
          {{stack}}
      </div>
    </div>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex'
  import PcVariables from './variables.component'

  export default {
    name: "pc-right-toolbar",
    components: {PcVariables},
    computed: {
      ...mapGetters(['selected_event']),

    },
  }
</script>

<style scoped>

</style>