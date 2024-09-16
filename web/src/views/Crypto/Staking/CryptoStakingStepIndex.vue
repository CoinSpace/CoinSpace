<script>

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsLoader from '../../../components/CsLoader.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import HistoryIcon from '../../../assets/svg/history.svg';
import ReceiveIcon from '../../../assets/svg/receive.svg';
import SendIcon from '../../../assets/svg/send.svg';

import { cryptoToFiat } from '../../../lib/helpers.js';

import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormTextareaReadonly,
    CsLoader,
    HistoryIcon,
    ReceiveIcon,
    SendIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  data() {
    return {
      isLoading: true,
      staked: undefined,
      fiat: undefined,
      apr: undefined,
      error: undefined,
    };
  },
  computed: {
    supportUrl() {
      if (this.$wallet.crypto._id === 'ethereum@ethereum') {
        return 'https://support.coin.space/hc/en-us/articles/30344399125780';
      }
    },
  },
  async onShow() {
    this.isLoading = true;
    this.error = undefined;
    await this.$wallet.cleanup();
    try {
      const { staked, apr } = await this.$wallet.staking();
      this.staked = staked;
      this.apr = apr;
      const price = await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency);
      const priceUSD = this.$wallet.isCsFeeSupported ?
        await this.$account.market.getPrice(this.$wallet.crypto._id, 'USD') : undefined;
      this.updateStorage({
        // cache price for all steps
        price,
        priceUSD,
        pricePlatform: price,
      });
      this.fiat = cryptoToFiat(
        this.staked,
        price,
        this.$wallet.crypto.decimals
      );
    } catch (err) {
      this.error = this.$t('Error! Please try again later.');
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  },
};
</script>

<template>
  <MainLayout :title="$t('Staking')">
    <CsLoader v-if="isLoading" />
    <div
      v-else-if="error"
      class="&__error"
    >
      {{ error }}
    </div>
    <template v-else>
      <CsFormGroup class="&__content">
        <CsFormTextareaReadonly
          :label="$t('Staked')"
          :value="`${staked} ${$wallet.crypto.symbol}`"
        />
        <div>
          {{ $c(fiat) }}
        </div>
        <CsFormTextareaReadonly
          :label="$t('APR')"
          :value="$n(apr, 'percent', { signDisplay: 'never' })"
        />
        <CsButton
          type="primary-link"
          @click="$safeOpen(supportUrl)"
        >
          {{ $t('How it works?') }}
        </CsButton>
      </CsFormGroup>

      <CsButtonGroup
        class="&__actions"
        type="circle"
      >
        <CsButton
          type="circle"
          @click="next('stake')"
        >
          <template #circle>
            <SendIcon />
          </template>
          {{ $t('Stake') }}
        </CsButton>
        <CsButton
          v-if="staked?.value > 0n"
          type="circle"
          @click="next('unstake')"
        >
          <template #circle>
            <ReceiveIcon />
          </template>
          {{ $t('Unstake') }}
        </CsButton>
        <CsButton
          type="circle"
          @click="next('pendingRequests')"
        >
          <template #circle>
            <HistoryIcon />
          </template>
          {{ $t('Pending requests') }}
        </CsButton>
      </CsButtonGroup>
    </template>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__content {
      flex-grow: 1;
    }

    &__actions {
      position: relative;
      width: 100%;
      max-width: 25rem;
      align-self: center;
    }

    &__error {
      @include text-md;
    }
  }
</style>
