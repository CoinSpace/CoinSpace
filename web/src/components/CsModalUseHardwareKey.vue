<script>
import CsButton from '../components/CsButton.vue';
import CsButtonGroup from '../components/CsButtonGroup.vue';
import CsModal from '../components/CsModal.vue';

import eventBus from '../lib/eventBus.js';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsModal,
  },
  data() {
    return {
      options: { show: false },
      type: ['mac', 'linux'].includes(this.env.VITE_PLATFORM) ? 'modal' : 'overlay',
    };
  },
  mounted() {
    eventBus.on('CsModalUseHardwareKey', (options) => {
      this.options = options;
    });
  },
  methods: {
    close() {
      this.options.cancel();
    },
  },
};
</script>

<template>
  <CsModal
    v-if="type === 'modal'"
    :show="options.show"
    :title="$t('Hardware key')"
    @close="close"
  >
    {{ $t('Use your hardware key.') }}
    <template #footer>
      <CsButtonGroup>
        <CsButton
          type="primary-link"
          @click="close"
        >
          {{ $t('Cancel') }}
        </CsButton>
      </CsButtonGroup>
    </template>
  </CsModal>
  <Teleport
    v-if="type === 'overlay'"
    to="body"
  >
    <Transition name="modal">
      <div
        v-if="options.show"
        class="&__overlay"
      />
    </Transition>
  </Teleport>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__overlay {
      @include overlay;
    }
  }
</style>
