<script>
import CsLoader from '../../../components/CsLoader.vue';
import CsNavbar from '../../../components/CsNavbar.vue';
import CsNavbarButton from '../../../components/CsNavbarButton.vue';
import CsRefreshButton from '../../../components/CsRefreshButton.vue';
import CsStep from '../../../components/CsStep.vue';

import CryptoHistoryRow from './CryptoHistoryRow.vue';
import SmartLayout from '../../../layouts/SmartLayout.vue';

import ArrowLeftIcon from '../../../assets/svg/arrowLeft.svg';

export default {
  components: {
    SmartLayout,
    CsLoader,
    CsNavbar,
    CsNavbarButton,
    CsRefreshButton,
    CryptoHistoryRow,
    ArrowLeftIcon,
  },
  extends: CsStep,
  data() {
    return {
      historyState: undefined, // $STATE_LOADING, $STATE_LOADED, $STATE_ERROR,
      cursor: undefined,
      hasMore: true,
      transactions: [],
      price: undefined,
    };
  },
  computed: {
    isLoading() {
      return this.$walletState === this.$STATE_LOADING || this.historyState === this.$STATE_LOADING;
    },
  },
  async mounted() {
    this.price = await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency);
    await this.$loadWallet();
    this.loadMore();
  },
  methods: {
    async refresh() {
      if (this.isLoading) return;
      this.historyState = undefined;
      this.cursor = undefined;
      this.hasMore = true;
      this.transactions = [];
      await this.$loadWallet();
      this.loadMore();
    },
    async loadMore() {
      if (this.isLoading) return;
      if (!this.hasMore) return;
      if (this.historyState === this.$STATE_ERROR) return;
      await this.load();
    },
    async load() {
      if (this.$walletState !== this.$STATE_LOADED) return;
      this.historyState = this.$STATE_LOADING;
      try {
        if (this.cursor === undefined) {
          await this.$account.exchange.loadExchanges();
        }
        const data = await this.$wallet.loadTransactions({ cursor: this.cursor });
        this.cursor = data.cursor;
        this.hasMore = data.hasMore;
        if (data.transactions && data.transactions.length) {
          this.transactions.push(
            ...(await this.$account.exchange.exchangifyTransactions(data.transactions, this.$wallet.crypto))
          );
        }
        this.historyState = this.$STATE_LOADED;
      } catch (err) {
        console.error(err);
        this.historyState = this.$STATE_ERROR;
      }
    },
  },
};
</script>

<template>
  <SmartLayout
    ref="layout"
    :isLoading="isLoading"
    :isLoadedAll="!hasMore"
    @loadMore="loadMore"
    @refresh="refresh"
  >
    <template #navbar="{ back }">
      <CsNavbar
        :title="$t('History')"
      >
        <template #left>
          <CsNavbarButton
            @click="back"
          >
            <ArrowLeftIcon />
          </CsNavbarButton>
        </template>
        <template #right>
          <CsRefreshButton
            :isLoading="isLoading"
            @click="refresh"
          />
        </template>
      </CsNavbar>
    </template>
    <div class="&">
      <div
        v-if="$walletState === $STATE_ERROR"
        class="&__error"
      >
        {{ $t('Error! Please try again later.') }}
      </div>

      <div
        v-if="transactions.length"
        class="&__transactions"
      >
        <CryptoHistoryRow
          v-for="transaction in transactions"
          :key="transaction.id"
          :transaction="transaction"
          :price="price"
          class="&__transaction"
          @click="next('transaction', { transaction, price })"
        />
      </div>

      <div
        v-else-if="historyState === $STATE_LOADED"
        class="&__empty"
      >
        {{ $t('You do not have any transactions yet.') }}
      </div>

      <div
        v-if="historyState === $STATE_ERROR"
        class="&__error"
      >
        {{ $t('Error! Please try again later.') }}
      </div>

      <CsLoader
        v-if="isLoading"
      />
    </div>
  </SmartLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;

    &__empty,
    &__error {
      @include text-md;
    }

    &__transactions {
      margin-right: -$spacing-sm;
      margin-left: -$spacing-sm;
    }
  }
</style>
