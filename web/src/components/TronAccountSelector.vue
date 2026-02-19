<script>
import CsFormSelect from './CsForm/CsFormSelect.vue';

export default {
  components: {
    CsFormSelect,
  },
  data() {
    const items = this.$account.details.getPlatformInstances('tron').items || [];
    const initial = this.$route.query.account !== undefined
      ? parseInt(this.$route.query.account, 10)
      : this.$account.details.getSelectedPlatformInstanceIndex('tron');
    return {
      value: Number.isInteger(initial) ? initial : 0,
      items,
    };
  },
  computed: {
    isExportRoute() {
      return this.$route?.name === 'crypto.export';
    },
    options() {
      const base = (this.$account.details.getPlatformInstances('tron').items || []).map((item) => {
        return {
          value: item.index,
          name: item.label || `Account ${item.index + 1}`,
        };
      });

      if (this.isExportRoute && base.length > 1) {
        return [{ value: 'all', name: this.$t('All keys') }, ...base];
      }
      return base;
    },
    isVisible() {
      return this.$wallet && this.$wallet.crypto?.platform === 'tron' && this.options.length > 1;
    },
  },
  watch: {
    '$route.query.account': {
      immediate: true,
      handler(value) {
        if (this.isExportRoute && this.$route.query.scope === 'all') {
          this.value = 'all';
          return;
        }
        const index = value !== undefined ? parseInt(value, 10) : undefined;
        if (Number.isInteger(index)) {
          this.value = index;
        }
      },
    },
    '$route.query.scope': {
      immediate: true,
      handler(value) {
        if (!this.isExportRoute) return;
        if (value === 'all') {
          this.value = 'all';
        }
      },
    },
  },
  methods: {
    async change(newValue) {
      if (this.isExportRoute && newValue === 'all') {
        this.value = 'all';
        await this.$router.replace({
          name: this.$route.name,
          params: this.$route.params,
          query: {
            ...this.$route.query,
            scope: 'all',
          },
        });
        return;
      }

      const index = parseInt(newValue, 10);
      this.value = index;
      try {
        this.$account.details.setSelectedPlatformInstanceIndex('tron', index);
        await this.$account.details.save();
      } catch (err) {
        console.error(err);
      }
      await this.$router.replace({
        name: this.$route.name,
        params: this.$route.params,
        query: {
          ...this.$route.query,
          account: index,
          scope: this.isExportRoute ? 'current' : this.$route.query.scope,
        },
      });

      // Ensure all tron-platform wallets (TRX + TRC20 tokens) exist for this instance.
      // Otherwise sidebar list may temporarily hide tokens for the newly selected account.
      try {
        const tronCryptos = this.$account.details.getSupportedCryptos().filter((c) => c.platform === 'tron');
        await Promise.all(tronCryptos.map((c) => this.$account.getOrCreateWalletInstance(c._id, index)));
        this.$account.emit('update');
      } catch (err) {
        console.error(err);
      }
    },
  },
};
</script>

<template>
  <div
    v-if="isVisible"
    class="&"
  >
    <CsFormSelect
      :modelValue="value"
      :options="options"
      :label="$t('Account')"
      small
      @update:modelValue="change"
    />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    margin-top: $spacing-lg;
  }
</style>
