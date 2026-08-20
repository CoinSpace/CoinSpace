<script>
import { cryptoToFiat } from '../../lib/helpers.js';

import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsFormGroup,
    CsFormTextareaReadonly,
  },
  extends: CsStep,
  data() {
    return {
      transaction: this.args.transaction,
      price: this.args.price,
      isLoading: false,
    };
  },
  computed: {
    amount() {
      return `${this.transaction.incoming ? '+' : '-'}${this.transaction.amount} ${this.transaction.symbol}`;
    },
    amountConverted() {
      return this.$fiat(cryptoToFiat(this.transaction.amount, this.price));
    },
    status() {
      const { status, timestamp } = this.transaction;
      if (status === 'pending') {
        return this.$t('Pending');
      } else if (status === 'success') {
        return this.$d(timestamp, 'short');
      } else if (status === 'failed') {
        return this.$t('Failed');
      }
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Transaction')">
    <div class="&__header">
      <div
        class="&__amount-crypto"
        :class="{
          '&__amount-crypto--positive': transaction.incoming,
          '&__amount-crypto--negative': !transaction.incoming,
        }"
        dir="ltr"
      >
        {{ amount }}
      </div>
      <div
        v-if="price"
        class="&__amount-fiat"
        dir="ltr"
      >
        {{ amountConverted }}
      </div>
      <div class="&__status">
        {{ status }}
      </div>
    </div>

    <CsFormGroup class="&__info">
      <CsFormTextareaReadonly
        v-if="!transaction.incoming"
        :label="$t('Merchant')"
        :value="transaction.merchant"
      />
      <CsFormTextareaReadonly
        v-if="!transaction.incoming"
        :label="$t('Purchase amount')"
        :value="transaction.purchaseAmount"
      />
      <CsFormTextareaReadonly
        :label="$t('Transaction ID')"
        :value="transaction.id"
      />
    </CsFormGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-2xs);
      text-align: center;
    }

    &__amount-crypto {
      @include text-lg;
      @include ellipsis;
      width: 100%;

      &--positive {
        color: var(--color-primary);
      }

      &--negative {
        color: var(--color-danger);
      }
    }

    &__amount-fiat {
      @include text-sm;
      @include ellipsis;
      width: 100%;
      color: var(--color-secondary);
    }

    &__status {
      @include text-sm;
      color: var(--color-secondary);
    }

    &__info {
      flex-grow: 1;
    }
  }
</style>
