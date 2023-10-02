<script>
import CsButton from './CsButton.vue';
import CsButtonGroup from './CsButtonGroup.vue';
import CsModal from './CsModal.vue';

import eventBus from '../lib/eventBus.js';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsModal,
  },
  data() {
    return {
      show: false,
    };
  },
  mounted() {
    eventBus.on('CsErrorHardwareNotSupported', () => this.show = true);
  },
};
</script>

<template>
  <CsModal
    :show="show"
    :title="$t('Error')"
    @close="show = false"
  >
    {{ $t('Hardware keys are not supported by your device.') }}
    <template #footer>
      <CsButtonGroup>
        <CsButton
          type="primary-link"
          @click="$safeOpen('https://support.coin.space/hc/en-us/articles/360051635571')"
        >
          {{ $t('Read more') }}
        </CsButton>
      </CsButtonGroup>
    </template>
  </CsModal>
</template>
