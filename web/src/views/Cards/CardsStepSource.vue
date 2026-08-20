<script>
import Fuse from 'fuse.js/dist/fuse.basic.esm.js';
import { cryptoSubtitleWithSymbol } from '../../lib/helpers.js';

import CsButton from '../../components/CsButton.vue';
import CsCryptoList from '../../components/CsCryptoList.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

import FilterIcon from '../../assets/svg/filter.svg';
import SearchIcon from '../../assets/svg/search.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    CsCryptoList,
    CsFormInput,
    FilterIcon,
    SearchIcon,
  },
  extends: CsStep,
  data() {
    return {
      query: '',
      selected: undefined,
    };
  },
  computed: {
    coins() {
      const coins = this.query ? this.coinsIndex.search(this.query).map(item => item.item) : this.coinsList;
      if (this.storage.filterPlatform) {
        return coins.filter((item) => item.platform._id === this.storage.filterPlatform);
      }
      return coins;
    },
    tokens() {
      let tokens = this.tokensList;
      if (this.query) {
        const exactByAddress = this.tokensList.filter(
          token => token.crypto.address?.toLowerCase() === this.query.toLowerCase()
        );
        const exactIds = new Set(exactByAddress.map(t => t.crypto._id));
        const fuzzy = this.tokensIndex.search(this.query)
          .map(item => item.item)
          .filter(item => !exactIds.has(item.crypto._id));
        tokens = [...exactByAddress, ...fuzzy];
      }
      if (this.storage.filterPlatform) {
        return tokens.filter((item) => item.platform._id === this.storage.filterPlatform);
      }
      return tokens;
    },
  },
  beforeCreate() {
    const cryptos = this.$account.cards.getDepositCryptos()
      .map((crypto) => {
        const platform = this.$account.cryptoDB.platform(crypto.platform);
        return {
          title: crypto.name,
          subtitle: cryptoSubtitleWithSymbol({ crypto, platform }),
          crypto,
          platform,
        };
      });

    this.coinsList = cryptos.filter((item) => item.crypto.type === 'coin');
    this.tokensList = cryptos.filter((item) => item.crypto.type === 'token');

    this.coinsIndex = new Fuse(this.coinsList, {
      keys: ['crypto.name', 'crypto.symbol', 'crypto._id'],
      threshold: 0.4,
    });
    this.tokensIndex = new Fuse(this.tokensList, {
      keys: ['crypto.name', 'crypto.symbol', 'crypto._id'],
      threshold: 0.5,
    });
  },
  beforeUnmount() {
    this.updateStorage({ filterPlatform: undefined });
  },
  methods: {
    select(id) {
      const crypto = this.$account.cryptoDB.get(id);
      const platform = this.$account.cryptoDB.platform(crypto.platform);
      this.updateStorage({ crypto, platform });
      this.back();
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Select a crypto')"
    wide
  >
    <div class="&__actions">
      <div class="&__action-search">
        <CsFormInput
          v-model="query"
          class="&__action-input"
          :placeholder="$t('Search')"
          small
          clear
        >
          <template #before>
            <SearchIcon />
          </template>
          <template #button>
            <CsButton
              small
              :type="storage.filterPlatform ? 'primary-light' : 'secondary'"
              @click="next('filterBlockchain')"
            >
              <FilterIcon />
            </CsButton>
          </template>
        </CsFormInput>
      </div>
    </div>
    <div
      v-if="coins.length === 0 && tokens.length === 0"
      class="&__message"
    >
      {{ $t('No coins or tokens found.') }}
    </div>
    <CsCryptoList
      :header="$t('Coins')"
      class="&__list"
      :items="coins"
      :selected="storage.toId"
      columns
      @select="select"
    />
    <CsCryptoList
      :header="$t('Tokens')"
      class="&__list &__list--last"
      :items="tokens"
      :selected="storage.toId"
      columns
      @select="select"
    />
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      @include breakpoint(lg) {
        flex-wrap: nowrap;
      }
    }

    &__action-search {
      flex-basis: 100%;
      @include breakpoint(lg) {
        flex-basis: 50%;
        margin-bottom: 0;
      }
    }

    &__message {
      @include text-md;
    }
  }
</style>
