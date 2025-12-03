<script>
import CsMecto from '../../../components/CsMecto.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    CsMecto,
    MainLayout,
  },
  extends: CsStep,
  methods: {
    select(address) {
      this.updateStorage({ temp: { address } });
      this.back();
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Mecto')">
    <CsMecto
      @select="select"
    />
  </MainLayout>
</template>
