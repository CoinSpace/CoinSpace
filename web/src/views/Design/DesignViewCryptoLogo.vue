<script>

import binancecoinATbinancesmartchain from '@coinspace/crypto-db/crypto/binance-coin@binance-smart-chain.json';
import bitcoinATbitcoin from '@coinspace/crypto-db/crypto/bitcoin@bitcoin.json';
import ethereumATethereum from '@coinspace/crypto-db/crypto/ethereum@ethereum.json';
import ethereumClassicATethereumClassic from '@coinspace/crypto-db/crypto/ethereum-classic@ethereum-classic.json';
import tetherATethereum from '@coinspace/crypto-db/crypto/tether@ethereum.json';
import usdcoinATbinancesmartchain from '@coinspace/crypto-db/crypto/usd-coin@binance-smart-chain.json';

import CsCryptoLogo from '../../components/CsCryptoLogo.vue';

export default {
  components: {
    CsCryptoLogo,
  },
  data() {
    return {
      items: [
        { ...bitcoinATbitcoin },
        { ...ethereumATethereum },
        { ...ethereumClassicATethereumClassic },
        { ...tetherATethereum, platform: ethereumATethereum },
        { ...usdcoinATbinancesmartchain, platform: binancecoinATbinancesmartchain },
      ],
    };
  },
};
</script>

<template>
  <div class="&">
    Medium size: 2rem

    <CsCryptoLogo
      v-for="item in items"
      :key="item._id"
      :crypto="item"
      class="&__medium"
    />

    Custom size: 4rem

    <CsCryptoLogo
      v-for="item in items"
      :key="item._id"
      :crypto="item"
      class="&__custom"
    />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;

    &__medium {
      width: $spacing-2xl;
      height: $spacing-2xl;
    }

    &__custom {
      width: $spacing-5xl;
      height: $spacing-5xl;
    }
  }
</style>
