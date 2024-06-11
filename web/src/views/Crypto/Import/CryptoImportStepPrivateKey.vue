<script>
import { errors } from '@coinspace/cs-common';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import PasteIcon from '../../../assets/svg/paste.svg';
import QrIcon from '../../../assets/svg/qr.svg';

import { isQrScanAvailable } from '../../../lib/helpers.js';
import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
    PasteIcon,
    QrIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    if (this.storage.temp) {
      this.privateKey = this.storage.temp;
      this.storage.temp = undefined;
    }
    this.isQrScanAvailable = await isQrScanAvailable();
  },
  data() {
    return {
      isLoading: false,
      isPasteAvailable: typeof navigator.clipboard?.readText === 'function',
      isQrScanAvailable: false,
      privateKey: '',
      error: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      this.error = undefined;
      const price = await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency);
      this.updateStorage({
        price,
        address: 'your wallet',
        privateKey: this.privateKey,
      });

      try {
        const amount = await this.$wallet.estimateImport({
          privateKey: this.privateKey,
          feeRate: this.storage.feeRate,
          price: this.storage.priceUSD,
        });
        this.updateStorage({ amount });
        this.next('confirm');
      } catch (err) {
        if (err instanceof errors.SmallAmountError || err instanceof errors.MinimumReserveDestinationError) {
          this.error = this.$t('Balance of private key is too small for transfer. Minimum is {amount} {symbol}', {
            amount: err.amount,
            symbol: this.$wallet.crypto.symbol,
          });
          return;
        }
        if (err instanceof errors.InvalidPrivateKeyError) {
          this.error = this.$t('Invalid private key');
          return;
        }
        if (err instanceof errors.DestinationEqualsSourceError) {
          this.error = this.$t('Destination address should not be equal source address');
          return;
        }
        if (err instanceof errors.InsufficientCoinForTokenTransactionError) {
          this.error = this.$t('Insufficient funds for token transaction. Required {amount} {symbol}', {
            amount: err.amount,
            symbol: this.$wallet.platform.symbol,
          });
          return;
        }
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    paste() {
      navigator.clipboard.readText()
        .then((text) => {
          this.privateKey = text;
        }, () => {});
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Transfer private key')">
    <div class="&__info">
      {{ $wallet.crypto.type === 'coin' ?
        $t('This will transfer all coins from the private key address to your wallet.') :
        $t('This will transfer all tokens from the private key address to your wallet.')
      }}
    </div>
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="privateKey"
        :label="$t('Private key')"
        :clear="true"
        :error="error"
        @update:modelValue="error = undefined"
      />

      <CsButtonGroup
        class="&__actions"
        type="circle"
      >
        <CsButton
          v-if="isPasteAvailable"
          type="circle"
          @click="paste"
        >
          <template #circle>
            <PasteIcon />
          </template>
          {{ $t('Paste') }}
        </CsButton>
        <CsButton
          v-if="isQrScanAvailable"
          type="circle"
          @click="next('qr')"
        >
          <template #circle>
            <QrIcon />
          </template>
          {{ $t('Scan QR') }}
        </CsButton>
      </CsButtonGroup>
    </CsFormGroup>

    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Continue') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__info {
      @include text-md;
    }

    &__container {
      flex-grow: 1;
    }
  }
</style>
