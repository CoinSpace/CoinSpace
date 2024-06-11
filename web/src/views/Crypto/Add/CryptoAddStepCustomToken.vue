<script>
import { cryptoSubtitleWithSymbol } from '../../../lib/helpers.js';
import { walletSeed } from '../../../lib/mixins.js';

import { AddressError } from '@coinspace/cs-common/errors';
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsCryptoLogo from '../../../components/CsCryptoLogo.vue';
import CsFormDropdown from '../../../components/CsForm/CsFormDropdown.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsModal from '../../../components/CsModal.vue';
import CsStep from '../../../components/CsStep.vue';
import CsTokenInfo from '../../../components/CsTokenInfo.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { RequestError } from '../../../lib/account/Request.js';
import {
  CryptoAlreadyAddedError,
  SeedRequiredError,
} from '../../../lib/account/Account.js';

import debounce from 'p-debounce';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsCryptoLogo,
    CsFormDropdown,
    CsFormGroup,
    CsFormInput,
    CsModal,
    CsTokenInfo,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    const alreadyAdded = this.$account.wallets().map((item) => item.crypto._id);
    return {
      isLoading: false,
      showModal: false,
      address: '',
      error: undefined,
      token: undefined,
      alreadyAdded,
    };
  },
  computed: {
    platform() {
      return this.$account.cryptoDB.get(this.storage.platform || 'ethereum@ethereum');
    },
    crypto() {
      return this.token;
    },
    description() {
      return [
        cryptoSubtitleWithSymbol({ crypto: this.crypto, platform: this.platform }),
        this.$t('{decimals} decimals', { decimals: this.crypto.decimals }),
      ];
    },
  },
  watch: {
    'storage.platform'(newPlatform, oldPlatform) {
      if (newPlatform !== oldPlatform) {
        this.error = undefined;
        this.token = undefined;
        this.address = '';
      }
    },
    address: debounce(async function(address) {
      if (!this.platform || !address) return;
      if (this.isLoading) return;
      this.isLoading = true;
      this.error = undefined;
      try {
        const token = await this.$account.getCustomTokenInfo(this.platform.platform, address);
        this.token = token;
      } catch (err) {
        this.token = undefined;
        if (err instanceof AddressError || err instanceof RequestError) {
          this.error = this.$t('Invalid token address');
          return;
        }
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }, 300),
  },
  methods: {
    async confirm() {
      if (!this.token) {
        return;
      }
      const platform = this.$account.cryptoDB.platform(this.token.platform);
      if (this.alreadyAdded.includes(platform._id)) {
        await this.add();
      } else {
        this.showModal = true;
      }
    },
    async add() {
      this.showModal = false;
      this.isLoading = true;
      this.error = undefined;
      try {
        await this.$account.addWallet(this.token);
        this.$router.replace({ name: 'crypto', params: { cryptoId: this.token._id } });
      } catch (err) {
        if (err instanceof SeedRequiredError) {
          await this.walletSeed(async (walletSeed) => {
            await this.$account.addWallet(this.token, walletSeed);
            this.$router.replace({ name: 'crypto', params: { cryptoId: this.token._id } });
          });
        } else if (err instanceof CryptoAlreadyAddedError) {
          this.error = this.$t('{token} already added.', {
            token: this.token.name,
          });
        } else {
          console.error(err);
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Add custom token')">
    <CsFormGroup :class="{'&__container': !crypto }">
      <CsFormDropdown
        :value="platform.name"
        :label="$t('Blockchain')"
        @click="next('selectBlockchain')"
      >
        <template #before>
          <CsCryptoLogo :crypto="platform" />
        </template>
      </CsFormDropdown>
      <CsFormInput
        v-model="address"
        :label="$t('Contract address')"
        clear
        :error="error"
        @update:modelValue="error = undefined; token = undefined"
      />
    </CsFormGroup>
    <CsTokenInfo
      v-if="crypto"
      class="&__container"
      :crypto="crypto"
      :platform="platform"
      :title="crypto.name"
      :subtitles="description"
    />
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Add token') }}
      </CsButton>
    </CsButtonGroup>
    <CsModal
      :show="showModal"
      :title="$t('Add token')"
      @close="showModal = false"
    >
      {{ $t("{crypto} is based on {platform}, which isn't in your wallet yet, so it will also be added.", {
        platform: platform.name,
        crypto: $t('Custom token')
      }) }}
      <template #footer>
        <CsButtonGroup>
          <CsButton
            type="primary"
            @click="add(token)"
          >
            {{ $t('Add') }}
          </CsButton>
          <CsButton
            type="primary-link"
            @click="showModal = false"
          >
            {{ $t('Cancel') }}
          </CsButton>
        </CsButtonGroup>
      </template>
    </CsModal>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__container {
      flex-grow: 1;
    }
  }
</style>
