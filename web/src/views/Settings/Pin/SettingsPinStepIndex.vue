<script>
import CsListItem from '../../../components/CsListItem.vue';
import CsListItems from '../../../components/CsListItems.vue';
import CsStep from '../../../components/CsStep.vue';
import CsSwitch from '../../../components/CsSwitch.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { TYPES } from '../../../lib/account/Biometry.js';
import { walletSeed } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsListItem,
    CsListItems,
    CsSwitch,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isBiometryEnabled: this.$account.biometry.isEnabled,
      isHighSecurityEnabled: this.$account.settings.get('1faWallet'),
      isLoading: false,
    };
  },
  computed: {
    labels() {
      const { $t } = this;
      switch (this.$account.biometry.type) {
        case TYPES.BIOMETRICS:
          return {
            title: $t('PIN & Biometrics'),
            biometry: $t('Biometrics'),
            description: $t('Use Biometrics instead of PIN.'),
          };
        case TYPES.FINGERPRINT:
          return {
            title: $t('PIN & Fingerprint'),
            biometry: $t('Fingerprint'),
            description: $t('Use Fingerprint instead of PIN.'),
          };
        case TYPES.TOUCH_ID:
          return {
            title: $t('PIN & Touch ID'),
            biometry: $t('Touch ID'),
            description: $t('Use Touch ID instead of PIN.'),
          };
        case TYPES.FACE_ID:
          return {
            title: $t('PIN & Face ID'),
            biometry: $t('Face ID'),
            description: $t('Use Face ID instead of PIN.'),
          };
        default:
          return {
            title: $t('PIN'),
          };
      }
    },
  },
  methods: {
    async toggleBiometry() {
      this.isLoading = true;
      if (this.env.VITE_BUILD_TYPE === 'phonegap') return this.toggleBiometryPhongap();
      await this.walletSeed(async (walletSeed) => {
        if (this.isBiometryEnabled) {
          await this.$account.biometry.disable(walletSeed);
        } else {
          await this.$account.biometry.enable(undefined, walletSeed);
        }
        this.isBiometryEnabled = this.$account.biometry.isEnabled;
      }, { keepStep: true });
      this.isLoading = false;
    },
    async toggleBiometryPhongap() {
      if (this.isBiometryEnabled) {
        await this.$account.biometry.disable();
        this.isBiometryEnabled = this.$account.biometry.isEnabled;
      } else {
        this.next('pin', {
          mode: 'deviceSeed',
          success: async (_, pin) => {
            await this.$account.biometry.enable(pin);
            this.isBiometryEnabled = this.$account.biometry.isEnabled;
            this.back();
          },
        });
      }
      this.isLoading = false;
    },
    async toggleHighSecurity() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        await this.$account.settings.set('1faWallet', !this.isHighSecurityEnabled, walletSeed);
        this.isHighSecurityEnabled = this.$account.settings.get('1faWallet');
      }, { keepStep: true });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout
    :title="labels.title"
  >
    <CsListItems>
      <CsListItem
        v-if="$account.biometry.isAvailable"
        :title="labels.biometry"
        :description="labels.description"
        :arrow="false"
      >
        <template #after>
          <CsSwitch
            :checked="isBiometryEnabled"
            :isLoading="isLoading"
            @click="toggleBiometry"
          />
        </template>
      </CsListItem>
      <CsListItem
        :title="$t('High security')"
        :description="$t('Send coins, export private keys, remove account, security settings.')"
        :arrow="false"
      >
        <template #after>
          <CsSwitch
            :checked="isHighSecurityEnabled"
            :isLoading="isLoading"
            @click="toggleHighSecurity"
          />
        </template>
      </CsListItem>
    </CsListItems>
  </MainLayout>
</template>
