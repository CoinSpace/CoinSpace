<script>
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsCard from '../../components/CsCard.vue';
import CsDropdownMenu from '../../components/CsDropdownMenu.vue';
import CsListItem from '../../components/CsListItem.vue';
import CsListItems from '../../components/CsListItems.vue';
import CsNavbar from '../../components/CsNavbar.vue';
import CsNavbarButton from '../../components/CsNavbarButton.vue';
import CsRefreshButton from '../../components/CsRefreshButton.vue';
import CsStep from '../../components/CsStep.vue';
import SmartLayout from '../../layouts/SmartLayout.vue';

import ArrowLeftIcon from '../../assets/svg/arrowLeft.svg';
import CoinsIcon from '../../assets/svg/coins.svg';
import DeleteIcon from '../../assets/svg/delete.svg';
import HistoryIcon from '../../assets/svg/history.svg';
import KebabIcon from '../../assets/svg/kebab.svg';
import LockIcon from '../../assets/svg/lock.svg';
import ShowIcon from '../../assets/svg/show.svg';
import UnlockIcon from '../../assets/svg/unlock.svg';

import { cryptoToFiat } from '../../lib/helpers.js';
import { walletSeed } from '../../lib/mixins.js';

export default {
  components: {
    SmartLayout,
    CsCard,
    CsButtonGroup,
    CsButton,
    CsNavbar,
    CsNavbarButton,
    CsRefreshButton,
    ArrowLeftIcon,
    CoinsIcon,
    HistoryIcon,
    ShowIcon,
    LockIcon,
    UnlockIcon,
    KebabIcon,
    DeleteIcon,
    CsListItems,
    CsListItem,
    CsDropdownMenu,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
      isLoadingDetails: false,
      isLocking: false,
      error: undefined,
      card: this.storage.card,
    };
  },
  computed: {
    amount() {
      if (this.isLoading) return '...';
      return `${this.card.balance} ${this.card.symbol}`;
    },
    fiat() {
      if (this.isLoading) return '...';
      const fiat = cryptoToFiat(this.card.balance, this.storage.priceCard);
      return this.$fiat(fiat);
    },
  },
  methods: {
    async refresh() {
      if (this.isLoading) return;
      this.error = undefined;
      this.load();
    },
    async load() {
      this.isLoading = true;
      try {
        this.card = await this.$account.cards.show(this.card.id);
        this.storage.updateCard(this.card);
        this.updateStorage({
          priceCard: await this.$account.market.getPrice('tether@ethereum', this.$currency),
        });
      } catch (err) {
        this.error = this.$account.unknownError();
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    async details() {
      this.isLoadingDetails = true;
      await this.walletSeed(async () => {
        const details = await this.$account.cards.details(this.card.id);
        this.next('details', { ...details, cardholderName: this.card.cardholderName });
      });
      this.isLoadingDetails = false;
    },
    async toggleLock() {
      this.isLocking = true;
      if (this.card.status === 'locked') {
        const success = await this.$account.cards.unlock(this.card.id);
        if (success) this.card.status = 'active';
      } else {
        const success = await this.$account.cards.lock(this.card.id);
        if (success) this.card.status = 'locked';
      }
      this.isLocking = false;
    },
  },
};
</script>

<template>
  <SmartLayout
    :isLoading="isLoading"
    @refresh="refresh"
  >
    <template #navbar="{ back }">
      <CsNavbar
        :title="card.product?.name"
      >
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
          <CsDropdownMenu class="&__tools-dropdown">
            <template #button>
              <CsNavbarButton
                :title="$t('Menu')"
                :aria-label="$t('Menu')"
              >
                <KebabIcon />
              </CsNavbarButton>
            </template>
            <template #content>
              <CsListItems class="&__tools-dropdown-list">
                <CsListItem
                  v-if="!error"
                  :disabled="isLoading || isLocking"
                  :title="card.status === 'locked' ? $t('Unlock') : $t('Lock')"
                  :arrow="false"
                  @click="toggleLock"
                >
                  <template #before>
                    <UnlockIcon v-if="card.status === 'locked'" />
                    <LockIcon v-else />
                  </template>
                </CsListItem>

                <CsListItem
                  :title="$t('Remove')"
                  type="danger"
                  :arrow="false"
                  :disabled="isLoading"
                  @click="next('remove')"
                >
                  <template #before>
                    <DeleteIcon />
                  </template>
                </CsListItem>
              </CsListItems>
            </template>
          </CsDropdownMenu>
        </template>
      </CsNavbar>
    </template>
    <CsCard
      class="&__card"
      :productId="card.product?.id"
      :lastFourDigits="card.lastFourDigits"
      size="large"
      :disabled="isLoading"
      :locked="card.status === 'locked'"
    />
    <div
      v-if="!error"
      class="&__balance-row"
    >
      <div class="&__balance-header">
        {{ $t('Balance') }}
      </div>
      <div
        class="&__balance"
        @click="$account.toggleHiddenBalance()"
      >
        <div
          class="&__balance-amount"
          :title="amount"
          dir="ltr"
        >
          {{ $isHiddenBalance ? '*****' : amount }}
        </div>
        <div
          class="&__balance-fiat"
          :title="fiat"
          dir="ltr"
        >
          {{ $isHiddenBalance ? '*****' : fiat }}
        </div>
      </div>
    </div>
    <div
      class="&__controls"
    >
      <div
        v-if="error"
        class="&__error"
      >
        {{ error }}
      </div>
      <CsButtonGroup
        v-else
        class="&__controls-group"
        type="circle"
      >
        <CsButton
          type="circle"
          :disabled="isLoading"
          @click="next('topup')"
        >
          <template #circle>
            <CoinsIcon />
          </template>
          {{ $t('Top up') }}
        </CsButton>
        <CsButton
          type="circle"
          :disabled="isLoading || isLoadingDetails"
          @click="details"
        >
          <template #circle>
            <ShowIcon />
          </template>
          {{ $t('Details') }}
        </CsButton>
        <CsButton
          type="circle"
          :disabled="isLoading"
          @click="next('history')"
        >
          <template #circle>
            <HistoryIcon />
          </template>
          {{ $t('History') }}
        </CsButton>
      </CsButtonGroup>
    </div>
    <CsListItems class="&__tools">
      <CsListItem
        v-if="!error"
        :disabled="isLoading || isLocking"
        :title="card.status === 'locked' ? $t('Unlock') : $t('Lock')"
        :arrow="false"
        @click="toggleLock"
      >
        <template #before>
          <UnlockIcon v-if="card.status === 'locked'" />
          <LockIcon v-else />
        </template>
      </CsListItem>
      <CsListItem
        :title="$t('Remove')"
        type="danger"
        :arrow="false"
        :disabled="isLoading"
      >
        <template #before>
          <DeleteIcon />
        </template>
      </CsListItem>
    </CsListItems>
  </SmartLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__error {
      @include text-md;
      flex-grow: 1;
    }

    &__balance-row {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xs);
      @include breakpoint(lg) {
        flex-grow: 1;
      }
    }

    &__balance-header {
      @include text-sm;
      color: var(--color-secondary);
    }

    &__balance {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      column-gap: var(--spacing-md);
      cursor: pointer;
    }

    &__balance-amount {
      @include text-md;
      @include text-bold;
      @include ellipsis;
      display: flex;
      gap: var(--spacing-xs);
    }

    &__balance-fiat {
      @include text-sm;
      @include text-bold;
      @include ellipsis;
    }

    &__controls {
      flex-grow: 1;
      @include breakpoint(lg) {
        flex-grow: 0;
      }
    }

    &__controls-group {
      max-width: 25rem;
    }

    &__tools {
      @include breakpoint(lg) {
        display: none;
      }
    }

    &__tools-dropdown {
      display: none;
      @include breakpoint(lg) {
        display: block;
      }
    }

    &__tools-dropdown-list {
      padding: var(--spacing-xl);
    }
  }
</style>
