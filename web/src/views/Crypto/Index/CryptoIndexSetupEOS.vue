<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
  },
};
</script>

<template>
  <CsButtonGroup
    v-if="$walletState === $STATE_NEED_ACTIVATION"
    class="&"
  >
    <CsButton
      type="primary"
      @click="$router.push({ name: 'crypto.eossetup', params: { cryptoId: $wallet.crypto._id } })"
    >
      {{ $t('Setup EOS account') }}
    </CsButton>
  </CsButtonGroup>
</template>

<style lang="scss">
  .#{ $filename } {
    width: 100%;
    max-width: 25rem;
    align-self: center;
    @include breakpoint(lg) {
      align-self: flex-start;
    }
  }
</style>
