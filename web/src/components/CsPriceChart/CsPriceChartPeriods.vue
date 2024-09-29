<script>
export default {
  props: {
    period: {
      type: String,
      required: true,
    },
  },
  emits: ['change'],
  data() {
    return {
      periods: ['1D', '7D', '14D', '1M', '1Y'],
      current: this.period || '7D',
    };
  },
};
</script>

<template>
  <div class="&">
    <label
      v-for="item of periods"
      :key="item"
      class="&__period"
    >
      <input
        v-model="current"
        :value="item"
        class="&__input"
        type="radio"
        @change="$emit('change', current)"
      >
      <div class="&__button">
        {{ item }}
      </div>
    </label>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    position: relative;
    display: flex;
    padding: 0 $spacing-xl;

    @include breakpoint(lg) {
      max-width: 30rem;
    }

    &__period {
      position: relative;
      flex-grow: 1;
    }

    &__input {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      opacity: 0;
      pointer-events: none;
      &:checked ~ #{ $self }__button {
        background-color: $secondary-light;
      }
    }

    &__button {
      @include text-sm;
      display: flex;
      height: $spacing-2xl;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  }
</style>
