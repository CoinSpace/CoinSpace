<script>

const bitcoinATbitcoin = {
  _id: 'bitcoin@bitcoin',
  asset: 'bitcoin',
  platform: 'bitcoin',
  type: 'coin',
  name: 'Bitcoin',
  symbol: 'BTC',
  decimals: 8,
  logo: 'bitcoin.svg',
};
const ethereumATethereum = {
  _id: 'ethereum@ethereum',
  asset: 'ethereum',
  platform: 'ethereum',
  type: 'coin',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  logo: 'ethereum.svg',
};
const tetherATethereum = {
  _id: 'tether@ethereum',
  asset: 'tether',
  platform: 'ethereum',
  type: 'token',
  name: 'Tether',
  symbol: 'USDT',
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  decimals: 6,
  logo: 'tether.svg',
};

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
        { ...tetherATethereum, platform: ethereumATethereum },
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
      :platform="item.platform"
      class="&__medium"
    />

    Custom size: 4rem

    <CsCryptoLogo
      v-for="item in items"
      :key="item._id"
      :crypto="item"
      :platform="item.platform"
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
