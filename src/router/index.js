import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
// import Home from '../webgl/shaders/reference/HomeBeforeScratch'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/session-details',
    name: 'session-details',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/session-details.page')
  },
  {
    path: '/cloud-library',
    name: 'cloud-library',
    component: () => import(/* webpackChunkName: "cloud" */ '../views/cloud/cloud-library.page')
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
