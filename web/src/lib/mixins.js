export const onShowOnHide = {
  _isShown: false,
  _show(component) {
    if (this._isShown) return;
    this._isShown = true;
    if (this.onShow) this.onShow.call(component);
  },
  _hide(component) {
    if (!this._isShown) return;
    this._isShown = false;
    if (this.onHide) this.onHide.call(component);
  },
  mounted() { this.$options._show(this); },
  activated() { this.$options._show(this); },
  beforeUnmount() { this.$options._hide(this); },
  deactivated() { this.$options._hide(this); },
};

export const walletSeed = {
  methods: {
    async walletSeed(callback, { step = 'pin', keepStep = false, layout = 'MainLayout' } = {}) {
      try {
        if (this.$account.settings.get('1faWallet')) {
          this.next(step, {
            layout,
            mode: 'walletSeed',
            success: async (walletSeed) => {
              await callback(walletSeed);
              if (keepStep) this.back();
            },
          });
        } else {
          const walletSeed = await this.$account.getNormalSecurityWalletSeed();
          if (!walletSeed) return;
          await callback(walletSeed);
        }
      } catch (err) {
        console.error(err);
      }
    },
  },
};

export const redirectToApp = {
  methods: {
    redirectToApp() {
      if (this.$route.redirectedFrom && this.$route.redirectedFrom.name !== 'home') {
        this.$router.push(this.$route.redirectedFrom);
      } else {
        this.$router.replace({ name: 'home' });
      }
    },
  },
};
