<script>
import TriangleIcon from '../assets/svg/triangle.svg';

export default {
  components: {
    TriangleIcon,
  },
};
</script>

<template>
  <div class="&">
    <div
      class="&__button"
      tabindex="1"
    >
      <slot name="button" />
    </div>
    <div class="&__mask" />
    <div
      class="&__wrapper"
      tabindex="1"
    >
      <TriangleIcon class="&__triangle" />
      <div class="&__content">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    position: relative;
    z-index: $zindex-dropdown;
    width: $spacing-5xl;
    height: 100%;

    &:focus-within {
      #{ $self }__mask,
      #{ $self }__wrapper {
        display: block;
      }
    }

    &__button {
      width: 100%;
      height: 100%;
    }

    &__mask {
      position: absolute;
      top: 0;
      display: none;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    &__wrapper {
      display: none;
      margin-top: -$spacing-md;
      filter: drop-shadow(0 0 $spacing-3xl rgb(0 0 0 / 10%));

      #{ $self }__triangle {
        display: block;
        width: $spacing-xl;
        height: 0.625rem;
        margin: 0 auto;
      }
    }

    &__content {
      width: 22.5rem;
      border-radius: 0.625rem;
      margin-left: calc(100% - 22.5rem - $spacing-xs);
      background-color: $background-color;
    }
  }
</style>
