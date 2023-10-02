<script>
import CsErrorHardwareNotSupported from './components/CsErrorHardwareNotSupported.vue';
import CsModalUseHardwareKey from './components/CsModalUseHardwareKey.vue';
import CsUpdater from './components/CsUpdater.vue';
import { RouterView } from 'vue-router';

export default {
  components: {
    RouterView,
    CsErrorHardwareNotSupported,
    CsModalUseHardwareKey,
    CsUpdater,
  },
  mounted() {
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      window.navigator.splashscreen.hide();
    }
  },
};
</script>

<template>
  <RouterView />
  <CsUpdater />
  <CsErrorHardwareNotSupported />
  <CsModalUseHardwareKey />
</template>

<style lang="scss">
  #app {
    width: 100%;
    height: 100%;
  }
</style>
