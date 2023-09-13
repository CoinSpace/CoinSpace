<template>
  <div class="&">
    <div class="&__text-xs">
      text-xs:  Lorem ipsum dolor sit amet.
    </div>
    <div class="&__text-sm">
      text-sm: Lorem ipsum dolor sit amet.
    </div>
    <div class="&__text-md">
      text-md: Lorem ipsum dolor sit amet.
    </div>
    <div class="&__text-lg">
      text-lg: Lorem ipsum dolor sit amet.
    </div>
    <div class="&__text-xl">
      text-xl: Lorem ipsum dolor sit amet.
    </div>
    <div class="&__text-2xl">
      text-2xl: Lorem ipsum dolor sit amet.
    </div>
    <div class="&__text-3xl">
      text-3xl: Lorem ipsum dolor sit amet.
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    &__text-xs { @include text-xs; }
    &__text-sm { @include text-sm; }
    &__text-md { @include text-md; }
    &__text-lg { @include text-lg; }
    &__text-xl { @include text-xl; }
    &__text-2xl { @include text-2xl; }
    &__text-3xl { @include text-3xl; }
  }
</style>
