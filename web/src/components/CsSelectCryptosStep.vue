<script>
import { SeedRequiredError } from '../lib/account/Account.js';
import { cryptoSubtitleWithSymbol } from '../lib/helpers.js';

import AuthStepLayout from '../layouts/AuthStepLayout.vue';
import CsButton from './CsButton.vue';
import CsButtonGroup from './CsButtonGroup.vue';
import CsCryptoList from './CsCryptoList.vue';
import CsStep from './CsStep.vue';

import { redirectToApp, walletSeed } from '../lib/mixins.js';

export default {
  components: {
    AuthStepLayout,
    CsButton,
    CsButtonGroup,
    CsCryptoList,
  },
  extends: CsStep,
  mixins: [redirectToApp, walletSeed],
  data() {
    const { type, cryptos } = this.$account.cryptosToSelect;
    const selected = new Set();
    if (type === 'popular') {
      selected.add(cryptos[0]._id);
      if (this.$route.redirectedFrom?.name === 'crypto' && this.$route.redirectedFrom.params?.cryptoId) {
        const crypto = this.$account.cryptoDB.get(this.$route.redirectedFrom.params.cryptoId);
        if (crypto && crypto.supported && !crypto.deprecated) {
          selected.add(crypto._id);
          cryptos.splice(1, 0, crypto);
        }
      }
    }
    return {
      isLoading: false,
      cryptos: cryptos.map((crypto) => {
        const platform = this.$account.cryptoDB.platform(crypto.platform);
        return {
          title: crypto.name,
          subtitle: cryptoSubtitleWithSymbol({ crypto, platform }),
          crypto,
          platform,
        };
      }),
      selected,
      type,
    };
  },
  methods: {
    select(id) {
      if (this.selected.has(id)) {
        this.selected.delete(id);
      } else {
        this.selected.add(id);
      }
    },
    async add() {
      if (this.isLoading) return;
      this.isLoading = true;
      const cryptos = [...this.selected].map((id) => this.$account.cryptoDB.get(id));
      try {
        this.$account.details.setShownNewCryptoIds();
        await this.$account.addWallets(cryptos, this.storage.seed);
        this.redirectToApp();
      } catch (err) {
        if (err instanceof SeedRequiredError) {
          await this.walletSeed(async (walletSeed) => {
            await this.$account.addWallets(cryptos, walletSeed);
            this.redirectToApp();
          }, { layout: 'AuthStepLayout' });
        } else {
          console.error(err);
        }
      } finally {
        this.isLoading = false;
      }
    },
    async skip() {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        if (this.type === 'popular') {
          this.$account.details.setCryptos([]);
        }
        this.$account.details.setShownNewCryptoIds();
        await this.$account.details.save();
        this.redirectToApp();
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <AuthStepLayout
    :title="type === 'popular' ? $t('Select your cryptos') : $t('New cryptos')"
    @back="skip"
  >
    <div class="&__message">
      {{ type === 'popular' ?
        $t('Start with a few cryptos, others will be available after login.') :
        $t('Select new cryptos you want to add to your wallet.')
      }}
    </div>
    <CsCryptoList
      :header="type === 'popular' ? $t('Popular cryptos') : $t('New cryptos')"
      class="&__list"
      :items="cryptos"
      :isLoading="isLoading"
      :selected="selected"
      multiple
      @select="select"
    />
    <CsButtonGroup>
      <CsButton
        v-if="selected.size"
        type="primary"
        :isLoading="isLoading"
        @click="add"
      >
        {{ $t('Add ({count})', { count: selected.size }) }}
      </CsButton>
      <CsButton
        v-if="!selected.size"
        type="primary-link"
        :isLoading="isLoading"
        @click="skip"
      >
        {{ $t('Skip') }}
      </CsButton>
    </CsButtonGroup>
  </AuthStepLayout>
</template>


<style lang="scss">
.#{ $filename } {
  &__message {
    @include text-md;
  }

  &__list {
    flex-grow: 1;
  }
}
</style>
