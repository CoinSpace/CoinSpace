<script>
import CsAvatar from '../components/CsAvatar.vue';
import CsButton from '../components/CsButton.vue';
import CsLoader from '../components/CsLoader.vue';

import { onShowOnHide } from '../lib/mixins.js';

export default {
  components: {
    CsAvatar,
    CsButton,
    CsLoader,
  },
  mixins: [onShowOnHide],
  emits: ['select'],
  data() {
    return {
      isLoading: false,
      users: [],
    };
  },
  onShow() {
    this.search();
  },
  methods: {
    async search() {
      if (this.isLoading === true) return;
      this.isLoading = true;
      try {
        this.users = await this.$account.mecto.search();
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    select(address) {
      this.$emit('select', address);
    },
  },
};
</script>

<template>
  <CsLoader v-if="isLoading" />

  <div
    v-if="!isLoading"
    class="&__results"
  >
    <div
      v-if="users.length"
      class="&__users-grid"
    >
      <div
        v-for="user in users"
        :key="user.username"
        class="&__user"
        @click="select(user.address)"
      >
        <CsAvatar
          class="&__avatar"
          :avatar="user.avatar"
          :size="80"
        />
        <div class="&__username">
          {{ user.username }}
        </div>
      </div>
    </div>

    <div v-else>
      {{ $t('No users found nearby.') }}
    </div>
  </div>

  <CsButton
    v-if="!isLoading"
    type="primary"
    @click="search"
  >
    {{ $t('Search again') }}
  </CsButton>
</template>

<style lang="scss">
  .#{ $filename } {
    &__results {
      @include text-md;
      flex-grow: 1;
    }

    &__users-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      column-gap: $spacing-xs;
      row-gap: $spacing-3xl;
    }

    &__user {
      display: flex;
      min-width: $spacing-6xl;
      flex: 0 0 calc(50% - $spacing-2xs);
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      gap: $spacing-lg;
    }

    &__avatar {
      width: $spacing-6xl;
      height: $spacing-6xl;
    }

    &__username {
      @include text-md;
      @include ellipsis;
      max-width: 100%;
    }
  }
</style>
