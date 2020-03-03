<template>
  <div class="all-variables">
    <div v-for="variable in variables" class="row single-variable">
      <div class="col-4 text-monospace text-secondary"> {{variable.name}}:</div>
      <div class="col text-monospace"> {{variable.value}}
      <span v-if="variable.value === null" class="text-danger small">None</span></div>
    </div>
  </div>


</template>

<script>
  class VariableValue {
    value : any
    name : string
    constructor (name, value) {
      this.name = name
      this.value = value
    }
  }
  export default {
    props: ['variables'],
    name: "pc-variables",
    computed: {
      mapping () {
        let vars = []
        // console.group('vars')
        for(let variable_name in this.variables) {
          if (this.variables.hasOwnProperty(variable_name)) {
            let variable_value = this.variables[variable_name];
            // console.log(variable_name, variable_value)
            vars.push(new VariableValue(variable_name, variable_value))

          }
        }
        console.groupEnd()

        return vars
      }
    },
  }
</script>

<style scoped>

</style>