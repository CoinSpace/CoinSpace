<template>
  <div class="&">
    {{ $t('Crypto information will be displayed here.') }}
    <br>
    {{ $t('Select a crypto from your wallet.') }}
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-md;
    text-align: center;
    @include text-md;
  }
</style>
