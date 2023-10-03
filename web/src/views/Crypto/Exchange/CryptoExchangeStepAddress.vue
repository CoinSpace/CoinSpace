<script>
import { cryptoSubtitle } from '../../../lib/helpers.js';
import { errors } from '@coinspace/cs-common';
import {
  ExchangeDisabledError,
  InternalExchangeError,
} from '../../../lib/account/ChangellyExchange.js';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsCryptoLogo from '../../../components/CsCryptoLogo.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsFormInputReadonly from '../../../components/CsForm/CsFormInputReadonly.vue';
import CsPoweredBy from '../../../components/CsPoweredBy.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { onShowOnHide } from '../../../lib/mixins.js';

import EditIcon from '../../../assets/svg/edit.svg';
import LocationIcon from '../../../assets/svg/location.svg';
import PasteIcon from '../../../assets/svg/paste.svg';
import QrIcon from '../../../assets/svg/qr.svg';
import WalletSmallIcon from '../../../assets/svg/walletSmall.svg';

import debounce from 'p-debounce';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsCryptoLogo,
    CsFormGroup,
    CsFormInput,
    CsFormInputReadonly,
    CsPoweredBy,
    EditIcon,
    LocationIcon,
    PasteIcon,
    QrIcon,
    WalletSmallIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  onShow() {
    if (this.args?.address) {
      this.addressOrAlias = this.args.address;
    }
  },
  data() {
    return {
      isLoading: false,
      isUnaliasSupported: this.$account.wallet(this.storage.to.crypto._id)?.isUnaliasSupported,
      addressOrAlias: '',
      address: this.storage.address,
      alias: undefined,
      qr: this.env.VITE_BUILD_TYPE === 'phonegap',
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
    switchWallet() {
      if (this.ownWallet) {
        this.ownWallet = false;
        this.address = undefined;
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
        try {
          await this.$account.exchange.validateAddress({
            to: this.storage.to.crypto._id,
            address: this.address,
          });
          this.updateStorage({
            address: this.address,
            alias: this.alias,
          });
          this.next('confirm');
        } catch (err) {
          if (err instanceof errors.EmptyAddressError) {
            this.error = this.$t('Address should not be empty');
            return;
          }
          if (err instanceof errors.InvalidAddressError) {
            this.error = this.$t('Invalid address');
            return;
          }
          if (err instanceof ExchangeDisabledError) {
            this.error = this.$t('Exchange is currently unavailable for this pair');
            return;
          }
          if (err instanceof InternalExchangeError) {
            this.error = this.$t('Exchange is unavailable');
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
          this.addressOrAlias = text;
        }, () => {});
    },
    async scan() {
      window.qrScan((address) => {
        this.addressOrAlias = address;
      });
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Exchange {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__container">
      <CsFormInputReadonly
        :label="$t('Destination blockchain')"
        :value="storage.to.platform.name"
      >
        <template #before>
          <CsCryptoLogo
            :crypto="storage.to.platform"
          />
        </template>
      </CsFormInputReadonly>
      <CsFormInputReadonly
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
      </CsFormInputReadonly>
      <CsFormInput
        v-if="!ownWallet"
        v-model="addressOrAlias"
        :label="$t('Wallet address')"
        :error="error"
        :clear="true"
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
          type="circle"
          @click="paste"
        >
          <template #circle>
            <PasteIcon />
          </template>
          {{ $t('Paste') }}
        </CsButton>
        <CsButton
          v-if="storage.to.crypto.supported !== false"
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
    <CsButtonGroup>
      <CsPoweredBy powered="changelly" />
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Continue') }}
      </CsButton>
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