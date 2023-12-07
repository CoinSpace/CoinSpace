<script>
import CsQrScanPhonegap from './CsQrScanPhonegap.vue';
import CsQrScanWeb from './CsQrScanWeb.vue';
export default {
  components: {
    CsQrScanPhonegap,
    CsQrScanWeb,
  },
  emits: ['back', 'scan'],
};
</script>

<template>
  <component
    :is="env.VITE_BUILD_TYPE === 'phonegap' ? 'CsQrScanPhonegap' : 'CsQrScanWeb'"
    @back="$emit('back')"
    @scan="(args) => $emit('scan', args)"
  />
</template>
