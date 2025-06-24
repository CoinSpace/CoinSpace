<script>
import BaseExchange from '../../../lib/exchanges/BaseExchange.js';
import { errors } from '@coinspace/cs-common';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsCryptoLogo from '../../../components/CsCryptoLogo.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsPoweredBy from '../../../components/CsPoweredBy.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import EditIcon from '../../../assets/svg/edit.svg';
import LocationIcon from '../../../assets/svg/location.svg';
import PasteIcon from '../../../assets/svg/paste.svg';
import QrIcon from '../../../assets/svg/qr.svg';
import WalletSmallIcon from '../../../assets/svg/walletSmall.svg';

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
    CsCryptoLogo,
    CsFormGroup,
    CsFormInput,
    CsFormTextareaReadonly,
    CsPoweredBy,
    EditIcon,
    LocationIcon,
    PasteIcon,
    QrIcon,
    WalletSmallIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    if (this.args?.error) {
      this.error = this.$t('Invalid address');
    }
    if (this.storage.temp?.address) {
      this.error = undefined;
      this.addressOrAlias = this.storage.temp.address;
      this.storage.temp.address = undefined;
    }
    this.isQrScanAvailable = await isQrScanAvailable();
  },
  data() {
    return {
      isLoading: false,
      isUnaliasSupported: this.$account.wallet(this.storage.to.crypto._id)?.isUnaliasSupported,
      addressOrAlias: '',
      address: this.storage.address,
      alias: undefined,
      extraId: undefined,
      isQrScanAvailable: false,
      isPasteAvailable: typeof navigator.clipboard?.readText === 'function',
      ownWallet: this.storage.address === 'your wallet',
      subtitle: cryptoSubtitle(this.$wallet),
      error: undefined,
    };
  },
  watch: {
    addressOrAlias: debounce(async function(value) {
      if (this.isUnaliasSupported) {
        this.isLoading = true;
        const data = await this.$account.wallet(this.storage.to.crypto._id).unalias(value);
        if (data) {
          this.address = data.address;
          this.alias = data.alias;
          if (this.storage.to.crypto.platform === 'ripple') {
            this.extraId = data.destinationTag;
          }
        } else {
          this.address = value;
          this.alias = undefined;
          if (this.storage.to.crypto.platform === 'ripple') {
            this.extraId = undefined;
          }
        }
        this.isLoading = false;
      } else {
        this.address = value;
      }
    }, 300),
  },
  methods: {
    switchWallet() {
      if (this.ownWallet) {
        this.ownWallet = false;
        this.address = undefined;
        this.error = undefined;
        this.addressOrAlias = '';
      } else {
        this.ownWallet = true;
        this.address = 'your wallet';
      }
    },
    async confirm() {
      if (this.ownWallet) {
        this.next('confirm');
      } else {
        this.isLoading = true;
        this.error = undefined;
        try {
          await this.$account.exchanges.validateAddress({
            to: this.storage.to.crypto._id,
            address: this.address,
            extraId: this.extraId,
            provider: this.storage.provider,
          });
          this.updateStorage({
            address: this.address,
            alias: this.alias,
            extraId: this.extraId,
          });
          if (BaseExchange.EXTRA_ID.includes(this.storage.to.crypto._id) && this.extraId === undefined) {
            this.next('meta');
          } else {
            this.next('confirm');
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
          console.error(err);
        } finally {
          this.isLoading = false;
        }
      }
    },
    paste() {
      navigator.clipboard.readText()
        .then((text) => {
          this.error = undefined;
          this.addressOrAlias = text;
        }, () => {});
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Swap {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__container">
      <CsFormTextareaReadonly
        :label="$t('Destination blockchain')"
        :value="storage.to.platform.name"
      >
        <template #before>
          <CsCryptoLogo
            :crypto="storage.to.platform"
          />
        </template>
      </CsFormTextareaReadonly>
      <CsFormTextareaReadonly
        v-if="address === 'your wallet'"
        :label="$t('Wallet address')"
        :value="$t('Your wallet')"
      >
        <template #before>
          <WalletSmallIcon />
        </template>
        <template #after>
          <EditIcon
            class="&__switch"
            @click="switchWallet"
          />
        </template>
      </CsFormTextareaReadonly>
      <CsFormInput
        v-if="!ownWallet"
        v-model="addressOrAlias"
        :label="$t('Wallet address')"
        :error="error"
        :clear="true"
        @update:modelValue="error = undefined"
      />

      <CsButtonGroup
        v-if="!ownWallet"
        class="&__actions"
        type="circle"
      >
        <CsButton
          v-if="$account.wallet(storage.to.crypto._id)"
          type="circle"
          @click="switchWallet"
        >
          <template #circle>
            <WalletSmallIcon />
          </template>
          {{ $t('Your wallet') }}
        </CsButton>
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
          v-if="storage.to.crypto.supported"
          type="circle"
          @click="next('mecto')"
        >
          <template #circle>
            <LocationIcon />
          </template>
          {{ $t('Mecto') }}
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
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Continue') }}
      </CsButton>
      <CsPoweredBy :powered="$account.exchanges.getProviderInfo(storage.provider)" />
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }

    &__switch {
      cursor: pointer;
    }

    &__actions {
      width: 100%;
      max-width: 25rem;
      align-self: center;
    }
  }
</style>
