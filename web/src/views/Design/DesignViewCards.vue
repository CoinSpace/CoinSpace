<script>
import CsCard from '../../components/CsCard.vue';

export default {
  components: {
    CsCard,
  },
};
</script>

<template>
  <div class="&">
    <div class="&__column">
      <CsCard
        productId="aurum"
        size="small"
        lastFourDigits="8888"
      />
      <CsCard
        productId="aurum"
        size="medium"
        lastFourDigits="8888"
      />
      <CsCard
        productId="aurum"
        size="large"
        lastFourDigits="8888"
      />
      <CsCard
        productId="aurum"
        size="large"
        lastFourDigits="8888"
        locked
      />
    </div>
    <div class="&__column">
      <CsCard
        productId="azure"
        size="small"
        lastFourDigits="8888"
      />
      <CsCard
        productId="azure"
        lastFourDigits="8888"
        size="medium"
      />
      <CsCard
        productId="azure"
        lastFourDigits="8888"
        size="large"
      />
      <CsCard
        productId="azure"
        lastFourDigits="8888"
        size="large"
        locked
      />
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    gap: var(--spacing-4xl);

    &__column {
      display: flex;
      width: 25rem;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }
  }
</style>
