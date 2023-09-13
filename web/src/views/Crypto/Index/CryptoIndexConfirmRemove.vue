<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsModal from '../../../components/CsModal.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsModal,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['cancel', 'confirm'],
};
</script>

<template>
  <CsModal
    :show="show"
    :title="$t('Remove {symbol}', { symbol: $wallet.crypto.symbol })"
    @close="$emit('cancel')"
  >
    <div>
      {{ $t('Are you sure you want to remove {name} from the wallet?', { name: $wallet.crypto.name }) }}
    </div>
    <div v-if="$wallet.crypto.type === 'coin' && $account.tokensByPlatform($wallet.crypto.platform).length > 0">
      {{ $t('All tokens on the {name} platform will also be removed.', { name: $wallet.platform.name }) }}
    </div>
    <template #footer>
      <CsButtonGroup>
        <CsButton
          type="danger-light"
          @click="$emit('confirm')"
        >
          {{ $t('Remove') }}
        </CsButton>
        <CsButton
          type="primary-link"
          @click="$emit('cancel')"
        >
          {{ $t('Cancel') }}
        </CsButton>
      </CsButtonGroup>
    </template>
  </CsModal>
</template>
