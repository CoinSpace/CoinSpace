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
      return this.$account.cryptoDB
        .platforms(TOKEN_PLATFORMS)
        .map((crypto) => {
          return {
            crypto,
            title: crypto.name,
            subtitle: crypto.symbol,
          };
        });
    },
  },
  methods: {
    select(id) {
      this.updateStorage({ platform: id });
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
      :selected="storage.platform"
      columns
      @select="select"
    />
  </MainLayout>
</template>
