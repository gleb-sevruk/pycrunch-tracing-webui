<template>
  <div class="row">
    <div class="col-12 text-monospace text-secondary">
      {{variable.name}}:<span v-if="!has_childs" class="text-light">
            <span v-if="variable.value === null" class="text-danger small"> None</span>
            <span v-else-if="variable.value === ''"  class="text-danger"> ""</span>
            <span v-else> {{variable.value}}</span>

    </span>
    </div>
<!--    <div class="col-8 text-monospace"  v-if="!has_childs">-->
<!--      <span v-if="variable.value === null" class="text-danger small">None</span>-->
<!--    </div>-->
    <div class="col-8">
<!--      filler -->
    </div>
    <div class="col-12 ml-3 dict-renderer " v-if="has_childs">

      <pc-single-variable v-for="(v, index) in childs" :key="index" :variable="v">
      </pc-single-variable>
    </div>
  </div>
</template>
<script>
  import JSON5 from '../../third-party/json5_custom'
  import {Variable} from '../../store/models'

  export default {
    name: 'pc-single-variable',
    props: ['variable'],
    computed: {
      has_childs () {
        let is_array = this.type === 'array'
        if (is_array && this.variable.value.length <= 0) {
          return false
        }
        if (this.variable.value === null) {
          return false
        }
        return this.type === 'dict' || is_array || this.type==='object'
      },
      type () {
        let value = this.variable.value
        let current_type = typeof value
        if (current_type === 'string') {
          if (value.startsWith('{')) {

            try {
              let obj = JSON5.parse(value)
              if (obj) {
                return 'dict'
              }
            } catch (e) {
              console.log('Error During parsing of dictionary', value)
            }
          }
        }
        if (current_type === 'object') {
          // make sure it is not an array
          if (Array.isArray(value)) {
            current_type = 'array'
          }
        }
        return current_type
      },
      childs () {
        let value_type = this.type
        if (value_type === 'dict') {
          let obj = JSON5.parse(this.variable.value)
          let result = []
          // console.table(obj)
          for (let prop in obj) {
            // console.log("obj." + prop + " = " + obj[prop]);
            result.push(new Variable(prop, obj[prop]))
          }
          return result
        }
        if (value_type === 'array' || value_type === 'object') {
          let obj = this.variable.value
          let result = []
          for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
              result.push(new Variable(prop, obj[prop]))
            }
          }
          return result
        }

      },
    },
  }
</script>
<style scoped lang="scss">
  @import "../../styles/colors";
  .dict-renderer {
    border-left: 1px solid $color-apple-gray-3;
  }
  .dict-renderer:hover {
    border-left: 1px solid $color-apple-gray-2;

  }
</style>