<script>
import CsButton from '../../../components/CsButton.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { cryptoToFiat } from '../../../lib/helpers.js';
import { walletSeed } from '../../../lib/mixins.js';

import AccelerateIcon from '../../../assets/svg/accelerate.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    AccelerateIcon,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      fiatMode: false,
      isLoading: false,
    };
  },
  computed: {
    fee() {
      if (this.fiatMode && this.storage.pricePlatform !== undefined) {
        return this.$t('{sign}{fee} fee', {
          fee: this.$c(cryptoToFiat(this.storage.replacement.fee, this.storage.pricePlatform)),
          sign: '-',
        });
      } else {
        return this.$t('{sign}{fee} {symbol} fee', {
          sign: '-',
          fee: this.storage.replacement.fee,
          symbol: this.$wallet.platform.symbol,
        });
      }
    },
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        try {
          await this.$wallet.createReplacementTransaction(this.storage.transaction, walletSeed);
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          console.error(err);
          this.updateStorage({ status: false });
        }
        this.next('accelerateStatus');
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Accelerate')">
    <div
      class="&__container"
    >
      <AccelerateIcon class="&__icon" />
      <div
        class="&__info"
        @click="fiatMode = !fiatMode"
      >
        <div class="&__title">
          {{ $t('Speed {percent}', {
            percent: $n(storage.replacement.percent, 'percent', {
              minimumFractionDigits: 0,
            }),
          }) }}
        </div>
        <div class="&__subtitle">
          {{ fee }}
        </div>
      </div>
    </div>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Confirm') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
    }

    &__icon {
      width: $spacing-9xl;
      height: $spacing-9xl;
    }

    &__info {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      gap: $spacing-2xs;
    }

    &__title {
      @include text-md;
      @include text-bold;
    }

    &__subtitle {
      @include text-sm;
    }
  }
</style>
