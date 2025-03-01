<script>
import CsCryptoList from '../../../components/CsCryptoList.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { TOKEN_PLATFORMS } from '../../../lib/constants.js';

export default {
  components: {
    MainLayout,
    CsCryptoList,
  },
  extends: CsStep,
  computed: {
    items() {
      return [{
        crypto: { _id: 'reset', type: 'custom' },
        title: 'All blockchains',
        subtitle: 'Reset filter',
      }, ...this.$account.cryptoDB
        .platforms(TOKEN_PLATFORMS)
        .map((crypto) => {
          return {
            crypto,
            title: crypto.name,
            subtitle: crypto.symbol,
          };
        })];
    },
  },
  methods: {
    select(id) {
      if (id === 'reset') {
        this.updateStorage({ filterPlatform: undefined });
      } else {
        this.updateStorage({ filterPlatform: id });
      }
      this.back();
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Choose a blockchain')"
    wide
  >
    <CsCryptoList
      :header="$t('Blockchains')"
      class="&__list"
      :items="items"
      :selected="storage.filterPlatform"
      columns
      @select="select"
    />
  </MainLayout>
</template>
