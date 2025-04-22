<script>
import { cryptoSubtitleWithSymbol } from '../../lib/helpers.js';

import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsCryptoLists from '../../components/CsCryptoLists.vue';
import CsStep from '../../components/CsStep.vue';

export default {
  components: {
    AuthStepLayout,
    CsCryptoLists,
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
    if (this.$route.redirectedFrom?.name === 'crypto' && this.$route.redirectedFrom.params?.cryptoId) {
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
      if (this.$route.redirectedFrom && this.$route.redirectedFrom.name !== 'home') {
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
    <CsCryptoLists
      :message="$t('Select which ones you want to add to your wallet.')"
      :coins="coins"
      :tokens="tokens"
      :isLoading="isLoading"
      :selected="selected"
      @select="select"
      @save="save"
      @skip="skip"
    />
  </AuthStepLayout>
</template>
