<script>
import CardsHistoryRow from './CardsHistoryRow.vue';
import CsLoader from '../../components/CsLoader.vue';
import CsNavbar from '../../components/CsNavbar.vue';
import CsNavbarButton from '../../components/CsNavbarButton.vue';
import CsRefreshButton from '../../components/CsRefreshButton.vue';
import CsStep from '../../components/CsStep.vue';
import SmartLayout from '../../layouts/SmartLayout.vue';

import ArrowLeftIcon from '../../assets/svg/arrowLeft.svg';

export default {
  components: {
    SmartLayout,
    CsLoader,
    CsNavbarButton,
    CsRefreshButton,
    CsNavbar,
    CardsHistoryRow,
    ArrowLeftIcon,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      error: undefined,
      cursor: undefined,
      hasMore: true,
      transactions: [],
    };
  },
  async mounted() {
    this.loadMore();
  },
  methods: {
    async refresh() {
      if (this.isLoading) return;
      this.error = undefined;
      this.cursor = undefined;
      this.hasMore = true;
      this.transactions = [];
      this.loadMore();
    },
    async loadMore() {
      if (this.isLoading) return;
      if (!this.hasMore) return;
      if (this.error) return;
      await this.load();
    },
    async load() {
      this.isLoading = true;
      try {
        const data = await this.$account.cards.loadTransactions(this.storage.card, this.cursor);
        this.updateStorage({
          priceCard: await this.$account.market.getPrice('tether@ethereum', this.$currency),
        });
        this.cursor = data.cursor;
        this.hasMore = data.hasMore;
        if (data.transactions && data.transactions.length) {
          this.transactions.push(...data.transactions.filter((item) => !item.hidden));
        }
      } catch (err) {
        console.error(err);
        this.error = err;
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <SmartLayout
    :isLoading="isLoading"
    :isLoadedAll="!hasMore"
    @loadMore="loadMore"
    @refresh="refresh"
  >
    <template #navbar="{ back }">
      <CsNavbar :title="$t('History')">
        <template #left>
          <CsNavbarButton
            :title="$t('Back')"
            :aria-label="$t('Back')"
            @click="back"
          >
            <ArrowLeftIcon class="rtl-mirror" />
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
        v-if="transactions.length"
        class="&__transactions"
      >
        <CardsHistoryRow
          v-for="transaction in transactions"
          :key="transaction.id"
          :transaction="transaction"
          :price="storage.priceCard"
          class="&__transaction"
          @click="next('transaction', { price: storage.priceCard, transaction })"
        />
      </div>

      <div
        v-else-if="!isLoading && !error"
        class="&__empty"
      >
        {{ $t('You do not have any transactions yet.') }}
      </div>

      <div
        v-if="error"
        class="&__error"
      >
        {{ $account.unknownError() }}
      </div>

      <CsLoader v-if="isLoading" />
    </div>
  </SmartLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);

    &__empty,
    &__error {
      @include text-md;
    }

    &__transactions {
      display: flex;
      flex-direction: column;
      margin-right: calc(-1 * var(--spacing-sm));
      margin-left: calc(-1 * var(--spacing-sm));
      gap: var(--spacing-2xs);
    }
  }
</style>
