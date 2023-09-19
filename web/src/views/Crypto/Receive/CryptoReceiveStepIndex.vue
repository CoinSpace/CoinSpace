<script>
import QRCode from 'qrcode-svg';

import * as BitcoinSymbols from '@coinspace/cs-bitcoin-wallet/symbols';
import * as MoneroSymbols from '@coinspace/cs-monero-wallet/symbols';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormInputReadonly from '../../../components/CsForm/CsFormInputReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import ChevronLeftIcon from '../../../assets/svg/chevronLeft.svg';
import ChevronRightIcon from '../../../assets/svg/chevronRight.svg';
import CoinsIcon from '../../../assets/svg/coins.svg';
import CopyIcon from '../../../assets/svg/copy.svg';
import LocationFillIcon from '../../../assets/svg/locationFill.svg';
import LocationIcon from '../../../assets/svg/location.svg';
import ShareIcon from '../../../assets/svg/share.svg';

import { cryptoSubtitle } from '../../../lib/helpers.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormInputReadonly,
    ChevronLeftIcon,
    ChevronRightIcon,
    CoinsIcon,
    CopyIcon,
    LocationFillIcon,
    LocationIcon,
    ShareIcon,
  },
  extends: CsStep,
  data() {
    return {
      subtitle: cryptoSubtitle(this.$wallet),
      address: this.$wallet.address,
      isAddressTypesSupported: this.$wallet.isAddressTypesSupported,
      isAddressChangeSupported: this.$wallet.isAddressChangeSupported,
      addressType: this.$wallet.addressType,
      addressTypes: this.$wallet.addressTypes,
      isMectoEnabled: false,
      isMectoLoading: false,
      isCopied: false,
    };
  },
  computed: {
    qr() {
      const qrcode = new QRCode({
        content: this.address,
        join: true,
        padding: 0,
        container: 'svg-viewbox',
      });
      return qrcode.svg();
    },
    addressTypeLabel() {
      if (this.addressTypes.length <= 1) return '';
      switch (this.addressType) {
        case BitcoinSymbols.ADDRESS_TYPE_P2PKH:
          return this.$t('Legacy');
        case BitcoinSymbols.ADDRESS_TYPE_P2SH:
          return this.$t('P2SH');
        case BitcoinSymbols.ADDRESS_TYPE_P2WPKH:
          return this.$t('Bech32');
        case MoneroSymbols.ADDRESS_TYPE_ADDRESS:
          return this.$t('Standard');
        case MoneroSymbols.ADDRESS_TYPE_SUBADDRESS:
          return this.$t('Subaddress');
        default:
          return '';
      }
    },
  },
  methods: {
    prevAddressType() {
      const i = this.addressTypes.indexOf(this.addressType);
      if (i === 0) return;
      this.$wallet.addressType = this.addressTypes[i - 1];
      this.addressType = this.$wallet.addressType;
      this.address = this.$wallet.address;
    },
    nextAddressType() {
      const i = this.addressTypes.indexOf(this.addressType);
      if (i === (this.addressTypes.length - 1)) return;
      this.$wallet.addressType = this.addressTypes[i + 1];
      this.addressType = this.$wallet.addressType;
      this.address = this.$wallet.address;
    },
    copy() {
      navigator.clipboard.writeText(this.address).then(() => {
        this.isCopied = true;
        setTimeout(() => {
          this.isCopied = false;
        }, 1000);
      });
    },
    async enableMecto() {
      if (this.isMectoLoading) return;
      if (!this.$account.mecto.isAccountSetup) {
        this.next('account');
        return;
      }
      this.isMectoLoading = true;
      try {
        await this.$account.mecto.enable(this.$wallet.address);
        this.isMectoEnabled = true;
      } catch (err) {
        console.error(err);
      } finally {
        this.isMectoLoading = false;
      }
    },
    async disableMecto() {
      if (this.isMectoLoading) return;
      this.isMectoLoading = true;
      try {
        await this.$account.mecto.disable();
        this.isMectoEnabled = false;
      } catch (err) {
        console.error(err);
      } finally {
        this.isMectoLoading = false;
      }
    },
    async share() {
      if (this.env.VITE_BUILD_TYPE === 'phonegap') {
        return window.plugins.socialsharing.shareWithOptions({
          message: this.address,
        });
      }
      try {
        if (navigator.share) {
          await navigator.share({
            title: this.$t('Wallet address'),
            text: this.address,
          });
        } else {
          const body = encodeURIComponent(`${this.address}\n\nSent from Coin Wallet\nhttps://coin.space`);
          this.$safeOpen(`mailto:?body=${body}`);
        }
      } catch (err) { /* empty */ }
    },
  },
};
</script>

<!-- eslint-disable vue/no-v-html -->
<template>
  <MainLayout
    :title="$t('Receive {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <div class="&__qr-wrapper">
      <CsButton
        v-if="isAddressTypesSupported"
        class="&__address-type-button"
        :class="{
          '&__address-type-button--disabled': addressTypes.indexOf(addressType) === 0,
        }"
        @click="prevAddressType"
      >
        <ChevronLeftIcon />
      </CsButton>
      <div
        class="&__qr"
        v-html="qr"
      />
      <CsButton
        v-if="isAddressTypesSupported"
        class="&__address-type-button"
        :class="{
          '&__address-type-button--disabled': addressTypes.indexOf(addressType) === (addressTypes.length - 1),
        }"
        @click="nextAddressType"
      >
        <ChevronRightIcon />
      </CsButton>
    </div>

    <div class="&__input-wrapper">
      <CsFormInputReadonly
        :value="address"
        :label="$t('Your wallet address') + (isAddressTypesSupported ? ` (${addressTypeLabel})` : '')"
        :info="(isAddressTypesSupported || isAddressChangeSupported) ? $t('Your wallet address') : false"
      >
        <template #info>
          <div v-if="isAddressChangeSupported">
            <!-- eslint-disable-next-line max-len -->
            {{ $t('Address will be changed after receiving funds. All previously used addresses remain valid and still can be used to receive funds multiple times. Please use fresh address for each receiving transaction to enhance your privacy.') }}
          </div>
          <div v-if="isAddressTypesSupported">
            <!-- eslint-disable-next-line max-len -->
            {{ $t('Not all address types are fully compatible on all platforms, so it is important to use a compatible address.') }}
          </div>
        </template>
        <template #infoFooter>
          <CsButtonGroup>
            <CsButton
              type="primary-link"
              @click="$safeOpen('https://support.coin.space/hc/en-us/articles/360046106453')"
            >
              {{ $t('Read more') }}
            </CsButton>
          </CsButtonGroup>
        </template>
      </CsFormInputReadonly>
    </div>

    <CsButtonGroup
      class="&__actions"
      type="circle"
    >
      <CsButton
        type="circle"
        @click="copy"
      >
        <template #circle>
          <CopyIcon />
        </template>
        {{ isCopied ? $t('Copied!') : $t('Copy') }}
      </CsButton>
      <CsButton
        v-if="!isMectoEnabled"
        type="circle"
        :class="{ '&__mecto': isMectoLoading }"
        @click="enableMecto"
      >
        <template #circle>
          <LocationIcon />
        </template>
        {{ $t('Enable Mecto') }}
      </CsButton>
      <CsButton
        v-if="isMectoEnabled"
        type="circle"
        class="&__mecto"
        @click="disableMecto"
      >
        <template #circle>
          <LocationFillIcon />
          <LocationFillIcon class="&__location" />
        </template>
        {{ $t('Disable Mecto') }}
      </CsButton>
      <CsButton
        type="circle"
        @click="share"
      >
        <template #circle>
          <ShareIcon />
        </template>
        {{ $t('Share') }}
      </CsButton>
      <CsButton
        v-if="$wallet.crypto._id === 'monero@monero'"
        type="circle"
        @click="next('moneroAccept')"
      >
        <template #circle>
          <CoinsIcon />
        </template>
        {{ $t('Accept') }}
      </CsButton>
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__qr-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__location {
      position: absolute;
      animation: mecto-icon 2s ease-out infinite;
    }

    &__qr {
      width: 12rem;
      height: 12rem;
      flex-shrink: 0;
      padding: $spacing-md;
      border: 1px solid $gray;
      border-radius: $spacing-lg;
    }

    &__address-type-button {
      width: 3.5rem;
      height: 3.5rem;

      &--disabled {
        opacity: 0.3;
        pointer-events: none;
      }

      svg {
        width: $spacing-xl;
        height: $spacing-xl;
        margin: 0 auto;
      }
    }

    &__input-wrapper {
      flex-grow: 1;
    }

    &__actions {
      position: relative;
      width: 100%;
      max-width: 25rem;
      align-self: center;
    }

    &__mecto {
      .cs-button__circle {
        background-color: $primary-brand;

        &:hover {
          background-color: darker($primary-brand, 5%);
        }

        &:active {
          background-color: darker($primary-brand, 10%);
        }
      }
    }
  }
</style>
