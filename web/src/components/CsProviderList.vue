<script>
import CsButton from './CsButton.vue';

// import BTCDirectIcon from '../assets/svg/btcDirect.svg';
// import BitnovoIcon from '../assets/svg/bitnovo.svg';
// import GuardarianIcon from '../assets/svg/guardarian.svg';
// import MoonpayIcon from '../assets/svg/moonpay.svg';
// import OnramperIcon from '../assets/svg/onramper.svg';
// import PaybisIcon from '../assets/svg/paybis.svg';

export default {
  components: {
    CsButton,
    // btcdirect: BTCDirectIcon,
    // bitnovo: BitnovoIcon,
    // guardarian: GuardarianIcon,
    // moonpay: MoonpayIcon,
    // onramper: OnramperIcon,
    // paybis: PaybisIcon,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    type: {
      // buy, sell, or select
      type: String,
      required: true,
    },
  },
  emits: ['click'],
  computed: {
    buttonType() {
      if (this.type === 'buy') {
        return 'primary-light';
      }
      if (this.type === 'sell') {
        return 'danger-light';
      }
      if (this.type === 'select') {
        return 'primary-light';
      }
      return '';
    },
    buttonLabel() {
      if (this.type === 'buy') {
        return this.$t('Buy');
      }
      if (this.type === 'sell') {
        return this.$t('Sell');
      }
      if (this.type === 'select') {
        return this.$t('Select');
      }
      return '';
    },
  },
};
</script>

<template>
  <div class="&">
    <div
      v-for="item in items"
      :key="item.id"
      class="&__item"
    >
      <img
        loading="lazy"
        :src="item.logo"
        :alt="item.name"
        class="&__logo"
      >
      <div class="&__content">
        <div
          class="&__title"
          :title="item.name"
        >
          {{ item.name }}
        </div>
        <div
          class="&__subtitle"
          :title="item.description"
        >
          {{ item.description }}
        </div>
      </div>
      <CsButton
        :type="buttonType"
        class="&__action"
        small
        @click="() => $emit('click', item)"
      >
        {{ buttonLabel }}
      </CsButton>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: $spacing-3xl;

    &__item {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      overflow-x: hidden;
    }

    &__logo {
      width: 2.75rem;
      height: 2.75rem;
      flex: 0 0 auto;
    }

    &__content {
      flex: 1 1 auto;
      overflow-x: hidden;
    }

    &__title {
      @include text-md;
      @include text-bold;
      @include ellipsis;
    }

    &__subtitle {
      @include text-xs;
      @include ellipsis;
      color: $secondary;
    }
  }
</style>
