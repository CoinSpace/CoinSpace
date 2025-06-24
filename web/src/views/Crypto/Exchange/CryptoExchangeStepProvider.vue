<script>
import CsProviderList from '../../../components/CsProviderList.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsProviderList,
  },
  extends: CsStep,
  data() {
    return {
    };
  },
  computed: {
    items() {
      return this.storage.estimations.map(({ provider, result }) => {
        const info = this.$account.exchanges.getProviderInfo(provider);
        return {
          ...info,
          description: `${result} ${this.storage.to.crypto.symbol}`,
        };
      });
    },
  },
  methods: {
    select(item) {
      this.updateStorage({
        provider: item.id,
      });
      this.back();
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Select provider')"
  >
    <CsProviderList
      :items="items"
      type="select"
      @click="select"
    />
  </MainLayout>
</template>
