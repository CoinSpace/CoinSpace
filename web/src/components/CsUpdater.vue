<script>
import CsButton from '../components/CsButton.vue';
import CsButtonGroup from '../components/CsButtonGroup.vue';
import CsModal from '../components/CsModal.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsModal,
  },
  data() {
    return {
      show: false,
      updateInfo: undefined,
    };
  },
  async mounted() {
    setTimeout(() => {
      this.checkUpdate();
    }, ['win', 'mac'].includes(this.env.VITE_PLATFORM) ? 5 * 60 * 1000 : 1000);
    setInterval(() => {
      this.checkUpdate();
    }, 12 * 60 * 60 * 1000);
  },
  methods: {
    async checkUpdate() {
      const arch = (['win', 'mac'].includes(this.env.VITE_PLATFORM) && window.process && window.process.arch) || 'any';
      try {
        this.updateInfo = await this.$account.request({
          url: `api/v4/update/${this.env.VITE_PLATFORM}/${arch}/v${this.env.VITE_VERSION}`,
          method: 'get',
          id: true,
        });
        if (!this.updateInfo) return;

        const isSkipped = this.updateInfo.version === this.$account.clientStorage.getUpdateShown();
        if (isSkipped) return;

        this.show = true;
        this.$account.clientStorage.setUpdateShown(this.updateInfo.version);
      } catch (err) {
        console.error(err);
      }
    },
    update() {
      if (!this.updateInfo) return;
      if (this.env.VITE_BUILD_TYPE === 'web') return location.reload();
      this.$safeOpen(this.updateInfo.url, '_blank');
    },
  },
};
</script>

<template>
  <CsModal
    :show="show"
    :title="$t('Update')"
    @close="show = false"
  >
    {{ $t('A new version of Coin Wallet is available. Would you like to update it now?') }}
    <template #footer>
      <CsButtonGroup>
        <CsButton
          type="primary"
          @click="update"
        >
          {{ $t('Update') }}
        </CsButton>
        <CsButton
          type="primary-link"
          @click="show = false"
        >
          {{ $t('Skip') }}
        </CsButton>
      </CsButtonGroup>
    </template>
  </CsModal>
</template>
