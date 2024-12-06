<script>
import CsButton from './CsButton.vue';
import CsButtonGroup from './CsButtonGroup.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
  },
};
</script>

<template>
  <div class="&__content">
    {{ $t('No funds. Buy or receive {symbol} to continue.', { symbol: $wallet.crypto.symbol }) }}
  </div>
  <CsButtonGroup>
    <CsButton
      v-if="$showRampsAndExchangeAndStaking"
      type="primary-light"
      @click="$router.push({ name: 'crypto.buy', params: { cryptoId: $wallet.crypto._id }})"
    >
      {{ $t('Buy') }}
    </CsButton>
    <CsButton
      type="secondary"
      @click="$router.push({ name: 'crypto.receive', params: { cryptoId: $wallet.crypto._id }})"
    >
      {{ $t('Receive') }}
    </CsButton>
  </CsButtonGroup>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__content {
      flex-grow: 1;
    }
  }
</style>
