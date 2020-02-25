<template>
  <div>
    <div class="heading"><span class="text-secondary">Inspector</span></div>
    <div class="text-monospace small">
      <span class="text-secondary">event:</span> {{selected_event.event_name}}
    </div>
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