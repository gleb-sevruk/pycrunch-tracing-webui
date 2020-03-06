<template>
  <div class="all-variables">
    <div v-for="variable in variables" class="single-variable">

      <pc-single-variable :variable="variable"/>
    </div>
  </div>


</template>

<script>
  import PcSingleVariable from './PcSingleVariable'
  import {Variable} from '../../store/models'


  export default {
    components: {PcSingleVariable},
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
            vars.push(new Variable(variable_name, variable_value))

          }
        }
        console.groupEnd()

        return vars
      }
    },
  }
</script>

<style scoped>
  .all-variables {
    /*max-height: 50%;*/
    overflow-x: hidden;
  }
</style>