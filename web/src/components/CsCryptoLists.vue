<script>
import CsButton from './CsButton.vue';
import CsButtonGroup from './CsButtonGroup.vue';
import CsCryptoList from './CsCryptoList.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsCryptoList,
  },
  props: {
    message: {
      type: String,
      default: undefined,
    },
    coins: {
      type: Array,
      required: true,
    },
    tokens: {
      type: Array,
      required: true,
    },
    selected: {
      type: Set,
      default() {
        return new Set();
      },
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select', 'save', 'skip'],
};
</script>

<template>
  <div
    v-if="message"
    class="&__message"
  >
    {{ message }}
  </div>
  <div class="&__content">
    <CsCryptoList
      :header="$t('Coins')"
      class="&__list"
      :items="coins"
      :isLoading="isLoading"
      :selected="selected"
      multiple
      @select="(id) => $emit('select', id)"
    />
    <CsCryptoList
      :header="$t('Tokens')"
      class="&__list &__list--last"
      :items="tokens"
      :isLoading="isLoading"
      :selected="selected"
      multiple
      @select="(id) => $emit('select', id)"
    />
  </div>
  <CsButtonGroup>
    <CsButton
      v-if="selected.size"
      type="primary"
      :isLoading="isLoading"
      @click="$emit('save')"
    >
      {{ $t('Add ({count})', { count: selected.size }) }}
    </CsButton>
    <CsButton
      v-if="!selected.size"
      type="primary-link"
      :isLoading="isLoading"
      @click="$emit('skip')"
    >
      {{ $t('Skip') }}
    </CsButton>
  </CsButtonGroup>
</template>

<style lang="scss">
  .#{ $filename } {
    &__message {
      @include text-md;
    }

    &__content {
      display: flex;
      flex: 1 1 100%;
      flex-direction: column;
      padding-right: max($spacing-xl, env(safe-area-inset-right));
      padding-left: max($spacing-xl, env(safe-area-inset-left));
      margin-right: calc(-1 * max($spacing-xl, env(safe-area-inset-right)));
      margin-left: calc(-1 * max($spacing-xl, env(safe-area-inset-left)));
      gap: $spacing-3xl;
      overflow-y: auto;
    }
  }
</style>
