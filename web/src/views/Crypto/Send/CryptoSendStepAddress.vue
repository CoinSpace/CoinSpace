<script>
import { errors } from '@coinspace/cs-common';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import LocationIcon from '../../../assets/svg/location.svg';
import PasteIcon from '../../../assets/svg/paste.svg';
import QrIcon from '../../../assets/svg/qr.svg';

import { onShowOnHide } from '../../../lib/mixins.js';
import {
  cryptoSubtitle,
  isQrScanAvailable,
} from '../../../lib/helpers.js';

import debounce from 'p-debounce';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
    LocationIcon,
    PasteIcon,
    QrIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    this.qr = await isQrScanAvailable();
    if (this.addressOrAlias === '') {
      if (this.args?.address) {
        this.addressOrAlias = this.args.address;
      } else if (this.$route.query?.address) {
        this.addressOrAlias = this.$route.query?.address;
      }
    }
  },
  data() {
    return {
      isLoading: false,
      isUnaliasSupported: this.$wallet.isUnaliasSupported,
      subtitle: cryptoSubtitle(this.$wallet),
      addressOrAlias: '',
      address: '',
      alias: '',
      qr: false,
      error: undefined,
    };
  },
  watch: {
    addressOrAlias: debounce(async function(value) {
      if (this.isUnaliasSupported) {
        this.isLoading = true;
        const data = await this.$wallet.unalias(value);
        if (data) {
          this.address = data.address;
          this.alias = data.alias;
        } else {
          this.address = value;
          this.alias = undefined;
        }
        this.isLoading = false;
      } else {
        this.address = value;
      }
      this.error = undefined;
    }, 300),
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      try {
        await this.$wallet.validateAddress({ address: this.address || '' });
        if (this.$wallet.isFeeRatesSupported) await this.$wallet.loadFeeRates();
        this.error = undefined;
        this.updateStorage({
          // cache price for all steps
          price: await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency),
          priceUSD: this.$wallet.isCsFeeSupported ?
            await this.$account.market.getPrice(this.$wallet.crypto._id, 'USD') : undefined,
          address: this.address,
          alias: this.alias,
          feeRate: (this.$wallet.isFeeRatesSupported && this.$wallet.feeRates.length === 1)
            ? this.$wallet.feeRates[0] : undefined,
        });
        if (this.$wallet.isMetaSupported) {
          this.next('meta');
        } else if (this.$wallet.isFeeRatesSupported && this.$wallet.feeRates.length !== 1) {
          this.next('fee');
        } else if (this.$wallet.isGasLimitSupported) {
          this.next('gas');
        } else {
          this.next('amount');
        }
      } catch (err) {
        if (err instanceof errors.EmptyAddressError) {
          this.error = this.$t('Address should not be empty');
          return;
        }
        if (err instanceof errors.InvalidAddressError) {
          this.error = this.$t('Invalid address');
          return;
        }
        if (err instanceof errors.DestinationEqualsSourceError) {
          this.error = this.$t('Destination address should not be equal source address');
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
          this.addressOrAlias = text;
        }, () => {});
    },
    async scan() {
      if (this.env.VITE_BUILD_TYPE === 'phonegap') {
        window.qrScan((address) => {
          this.addressOrAlias = address;
        });
      } else {
        this.next('qr');
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Send {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="addressOrAlias"
        :label="$t('Wallet address')"
        :error="error"
        :clear="true"
      />

      <CsButtonGroup
        class="&__actions"
        type="circle"
      >
        <CsButton
          type="circle"
          @click="paste"
        >
          <template #circle>
            <PasteIcon />
          </template>
          {{ $t('Paste') }}
        </CsButton>
        <CsButton
          type="circle"
          @click="next('mecto')"
        >
          <template #circle>
            <LocationIcon />
          </template>
          {{ $t('Mecto') }}
        </CsButton>
        <CsButton
          v-if="qr"
          type="circle"
          @click="scan"
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

    &__container {
      flex-grow: 1;
    }

    &__actions {
      width: 100%;
      max-width: 25rem;
      align-self: center;
    }
  }
</style>
