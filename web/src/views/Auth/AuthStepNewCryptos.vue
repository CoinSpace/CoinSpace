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
    const cryptos = this.$account.newCryptosToShow
      .map((crypto) => {
        const platform = this.$account.cryptoDB.platform(crypto.platform);
        return {
          title: crypto.name,
          subtitle: cryptoSubtitleWithSymbol({ crypto, platform }),
          crypto,
          platform,
        };
      });
    return {
      isLoading: false,
      coins: cryptos.filter((item) => item.crypto.type === 'coin'),
      tokens: cryptos.filter((item) => item.crypto.type === 'token'),
      selected: new Set(),
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
      await this.$account.addWallets(cryptos, this.storage.seed);
      this.done();
      this.isLoading = false;
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
    :title="$t('New cryptos')"
    @back="done"
  >
    <CsCryptoLists
      :message="$t('Select new cryptos you want to add to your wallet.')"
      :coins="coins"
      :tokens="tokens"
      :isLoading="isLoading"
      :selected="[...selected]"
      @select="select"
      @save="save"
      @skip="done"
    />
  </AuthStepLayout>
</template>
