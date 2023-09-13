<template>
  <div class="&">
    <router-link :to="{ name: 'design.typography' }">
      Typography
    </router-link>
    <router-link :to="{ name: 'design.buttons' }">
      Buttons
    </router-link>
    <router-link :to="{ name: 'design.inputs' }">
      Inputs
    </router-link>
    <router-link :to="{ name: 'design.numbers' }">
      Numbers
    </router-link>
    <router-link :to="{ name: 'design.list-items' }">
      List Items
    </router-link>
    <router-link :to="{ name: 'design.crypto-logo' }">
      Crypto Logo
    </router-link>
    <router-link :to="{ name: 'design.pull-list' }">
      Pull List
    </router-link>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
</style>
