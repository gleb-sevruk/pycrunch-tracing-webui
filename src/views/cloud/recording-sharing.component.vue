<template>
  <div class="sharing-modal__root">modal
    <div class="suggestions">Type user email to invite here</div>
      <el-autocomplete
          class="inline-input"
          v-model="input_email"
          :fetch-suggestions="querySearch"
          placeholder="Email"
          :trigger-on-focus="false"
          @select="willSelectSuggestion"
      ></el-autocomplete>
    <div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'pc-recording-sharing',
  data () {
    return {
      input_email: '',
    }
  },
  methods: {
    querySearch(queryString, cb) {
      // var links = this.links;
      // var results = queryString ? links.filter(this.createFilter(queryString)) : links;
      // call callback function to return suggestions

      cb([
          { "value": "vue"},
          { "value": "hue" },
      ]);
    },
    willSelectSuggestion (item) {
      console.log(item)
    }

  },
}
</script>

<style scoped>

</style>