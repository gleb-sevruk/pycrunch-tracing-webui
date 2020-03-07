import Vue from 'vue'

Vue.filter('round', function (value, accuracy, keep) {
  if (typeof value !== 'number') return value;

  let fixed = value.toFixed(accuracy);
  return keep ? fixed : +fixed;
})