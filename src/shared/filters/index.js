import Vue from 'vue'
import filesize from 'file-size'

Vue.filter('round', function (value, accuracy, keep) {
  if (typeof value !== 'number') return value;

  let fixed = value.toFixed(accuracy);
  return keep ? fixed : +fixed;
})

Vue.filter('humansize', function (value, x) {
  if (typeof value !== 'number') return value;

  return filesize(value).human('si')
})