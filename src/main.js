import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap/dist/css/bootstrap-grid.css';

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

// window.webglUtils = require('./webgl-utils')
// require('./webgl-utils')

Vue.use(ElementUI);

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
