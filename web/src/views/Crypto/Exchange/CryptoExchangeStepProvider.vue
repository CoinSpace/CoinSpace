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
    providers() {
      return this.storage.estimations.map((estimation) => {
        return {
          id: estimation.provider,
          name: this.$account.exchanges.getProviderName(estimation.provider),
          description: `${estimation.result} ${this.storage.to.crypto.symbol}`,
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
      :items="providers"
      type="select"
      @click="select"
    />
  </MainLayout>
</template>
