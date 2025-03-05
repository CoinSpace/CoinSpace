<script>
import { cryptoSubtitleWithSymbol } from '../../../lib/helpers.js';
import { walletSeed } from '../../../lib/mixins.js';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsModal from '../../../components/CsModal.vue';
import CsStep from '../../../components/CsStep.vue';
import CsTokenInfo from '../../../components/CsTokenInfo.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { SeedRequiredError } from '../../../lib/account/Account.js';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormTextareaReadonly,
    CsModal,
    CsTokenInfo,
    MainLayout,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
      showModal: false,
    };
  },
  computed: {
    platform() {
      return this.$account.cryptoDB.get(this.storage.platform);
    },
    token() {
      return this.storage.token;
    },
    url() {
      return this.storage.url;
    },
    description() {
      return [
        cryptoSubtitleWithSymbol({ crypto: this.token, platform: this.platform }),
        this.$t('{decimals} decimals', { decimals: this.token.decimals }),
      ];
    },
  },
  methods: {
    async add(force) {
      if (!force && !this.$account.hasWallet(this.platform._id)) {
        this.showModal = true;
        return;
      }
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
    <CsTokenInfo
      class="&__container"
      :crypto="token"
      :platform="platform"
      :title="token.name"
      :subtitles="description"
    />
    <CsFormGroup>
      <CsFormTextareaReadonly
        :label="$t('Contract address')"
        :value="token.address"
      />
      <CsButton
        v-if="url"
        type="primary-link"
        @click="$safeOpen(url)"
      >
        {{ $t('View in Block Explorer') }}
      </CsButton>
    </CsFormGroup>
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="add"
      >
        {{ $t('Add') }}
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
            @click="add(true)"
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
