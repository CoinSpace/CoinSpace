<script>
import CsQrScanPhonegap from './CsQrScanPhonegap.vue';
import CsQrScanWeb from './CsQrScanWeb.vue';
export default {
  components: {
    CsQrScanPhonegap,
    CsQrScanWeb,
  },
  emits: ['back'],
};
</script>

<template>
  <component
    :is="env.VITE_BUILD_TYPE === 'phonegap' ? 'CsQrScanPhonegap' : 'CsQrScanWeb'"
    @back="(args) => $emit('back', args)"
  />
</template>
