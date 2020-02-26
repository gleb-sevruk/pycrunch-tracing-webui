<template>
  <div id="app">
    <pc-header></pc-header>
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

#app {
}

</style>
<script>
  import PcHeader from './components/header.component'
  export default {
    components: {PcHeader}
  }
</script>