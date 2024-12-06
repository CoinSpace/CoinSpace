<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';

import ExchangeIcon from '../../../assets/svg/exchange.svg';
import HistoryIcon from '../../../assets/svg/history.svg';
import ReceiveIcon from '../../../assets/svg/receive.svg';
import SendIcon from '../../../assets/svg/send.svg';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    SendIcon,
    ReceiveIcon,
    ExchangeIcon,
    HistoryIcon,
  },
};
</script>

<template>
  <CsButtonGroup
    v-if="$walletState === $STATE_LOADED || $walletState === $STATE_LOADING"
    class="&"
    type="circle"
  >
    <CsButton
      type="circle"
      :disabled="$walletState === $STATE_LOADING"
      @click="$router.push({ name: 'crypto.send', params: { cryptoId: $wallet.crypto._id }})"
    >
      <template #circle>
        <SendIcon />
      </template>
      {{ $t('Send') }}
    </CsButton>
    <CsButton
      type="circle"
      :disabled="$walletState === $STATE_LOADING"
      @click="$router.push({ name: 'crypto.receive', params: { cryptoId: $wallet.crypto._id }})"
    >
      <template #circle>
        <ReceiveIcon />
      </template>
      {{ $t('Receive') }}
    </CsButton>
    <CsButton
      v-if="$showRampsAndExchangeAndStaking"
      type="circle"
      :disabled="$walletState === $STATE_LOADING"
      @click="$router.push({ name: 'crypto.exchange', params: { cryptoId: $wallet.crypto._id }})"
    >
      <template #circle>
        <ExchangeIcon />
      </template>
      {{ $t('Exchange') }}
    </CsButton>
    <CsButton
      type="circle"
      :disabled="$walletState === $STATE_LOADING"
      @click="$router.push({ name: 'crypto.history', params: { cryptoId: $wallet.crypto._id }})"
    >
      <template #circle>
        <HistoryIcon />
      </template>
      {{ $t('History') }}
    </CsButton>
  </CsButtonGroup>
</template>

<style lang="scss">
  .#{ $filename } {
    width: 100%;
    max-width: 25rem;
    @include breakpoint(lg) {
      align-self: flex-start;
    }
  }
</style>
