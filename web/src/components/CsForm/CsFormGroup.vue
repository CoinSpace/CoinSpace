<template>
  <div class="&">
    <slot />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }
</style>
