<script>
import CsCryptoList from '../../../components/CsCryptoList.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsCryptoList,
  },
  extends: CsStep,
  data() {
    return {
      platforms: [
        'ethereum@arbitrum',
        'avalanche@avalanche-c-chain',
        'binance-coin@binance-smart-chain',
        'ethereum@ethereum',
        'fantom@fantom',
        'ethereum@optimism',
        'polygon@polygon',
        'solana@solana',
        'toncoin@toncoin',
        'tron@tron',
      ],
    };
  },
  computed: {
    items() {
      return this.platforms.map((platform) => {
        const crypto = this.$account.cryptoDB.get(platform);
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
      columns
      @select="select"
    />
  </MainLayout>
</template>
