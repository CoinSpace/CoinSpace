<script setup>
import CsErrorHardwareNotSupported from './components/CsErrorHardwareNotSupported.vue';
import CsUpdater from './components/CsUpdater.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
  <CsUpdater />
  <CsErrorHardwareNotSupported />
</template>

<style lang="scss">
  #app {
    width: 100%;
    height: 100%;
  }
</style>
