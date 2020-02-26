<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Tracing</router-link> |
      <router-link to="/about" >Settings</router-link>
    </div>
    <router-view/>
  </div>
</template>

<style lang="scss">
@import './styles/_colors.scss';

html, body {
  /*rubber band scrolling surface*/
  background-color: $color-background;
}
hr {
  background-color: $color-background-x3;
}
#nav {
  text-align: center;

}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: $color-primary;
  background-color: $color-background;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
