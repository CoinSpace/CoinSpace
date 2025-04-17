<script>
import { cryptoSubtitleWithSymbol } from '../../lib/helpers.js';

import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsCryptoList from '../../components/CsCryptoList.vue';
import CsStep from '../../components/CsStep.vue';

export default {
  components: {
    AuthStepLayout,
    CsButton,
    CsButtonGroup,
    CsCryptoList,
  },
  extends: CsStep,
  data() {
    const cryptos = this.$account.cryptoDB.all
      .filter((item) => item.deprecated !== true && item.supported !== false)
      .map((crypto) => {
        const platform = this.$account.cryptoDB.platform(crypto.platform);
        return {
          title: crypto.name,
          subtitle: cryptoSubtitleWithSymbol({ crypto, platform }),
          crypto,
          platform,
        };
      });
    const selected = new Set(['bitcoin@bitcoin']);
    if (this.$route.redirectedFrom?.name === 'crypto' && this.$route.redirectedFrom?.params?.cryptoId) {
      const crypto = this.$account.cryptoDB.get(this.$route.redirectedFrom.params.cryptoId);
      if (crypto && crypto.deprecated !== true && crypto.supported !== false) {
        selected.add(crypto._id);
      }
    }
    return {
      isLoading: false,
      coins: cryptos.filter((item) => item.crypto.type === 'coin'),
      tokens: cryptos.filter((item) => item.crypto.type === 'token'),
      selected,
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
    async save() {
      if (this.isLoading) return;
      this.isLoading = true;
      const cryptos = [...this.selected].map((id) => this.$account.cryptoDB.get(id));
      await this.$account.loadWallets(cryptos, this.storage.seed);
      this.isLoading = false;
      this.done();
    },
    async skip() {
      if (this.isLoading) return;
      this.isLoading = true;
      await this.$account.loadWallets([], this.storage.seed);
      this.isLoading = false;
      this.done();
    },
    done() {
      if (this.$route.redirectedFrom?.name !== 'home') {
        this.$router.push(this.$route.redirectedFrom);
      } else {
        this.$router.replace({ name: 'home' });
      }
    },
  },
};
</script>

<template>
  <AuthStepLayout
    :title="$t('Select your cryptos')"
    @back="skip"
  >
    <div class="&__message">
      {{ $t('Select which ones you want to add to your wallet.') }}
    </div>
    <div class="&__content">
      <CsCryptoList
        :header="$t('Coins')"
        class="&__list"
        :items="coins"
        :isLoading="isLoading"
        :selected="[...selected]"
        multiple
        @select="select"
      />
      <CsCryptoList
        :header="$t('Tokens')"
        class="&__list &__list--last"
        :items="tokens"
        :isLoading="isLoading"
        :selected="[...selected]"
        multiple
        @select="select"
      />
    </div>
    <CsButtonGroup>
      <CsButton
        v-if="selected.size"
        type="primary"
        :isLoading="isLoading"
        @click="save"
      >
        {{ $t('Save ({count})', { count: selected.size }) }}
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

    &__content {
      display: flex;
      flex: 1 1 100%;
      flex-direction: column;
      padding-right: max($spacing-xl, env(safe-area-inset-right));
      padding-left: max($spacing-xl, env(safe-area-inset-left));
      margin-right: calc(-1 * max($spacing-xl, env(safe-area-inset-right)));
      margin-left: calc(-1 * max($spacing-xl, env(safe-area-inset-left)));
      gap: $spacing-3xl;
      overflow-y: auto;
    }
  }
</style>
