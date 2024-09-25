<script>
import CsAvatar from '../../components/CsAvatar.vue';
import CsButton from '../../components/CsButton.vue';
import CsListItem from '../../components/CsListItem.vue';
import CsListItemDropdown from '../../components/CsListItemDropdown.vue';
import CsListItems from '../../components/CsListItems.vue';
import MainLayout from '../../layouts/MainLayout.vue';
import { currencies } from '../../lib/account/Market.js';
import { prettyVersion } from '../../lib/version.js';

import { TYPES } from '../../lib/account/Biometry.js';
import { languages } from '../../lib/i18n/i18n.js';

export default {
  components: {
    MainLayout,
    CsAvatar,
    CsButton,
    CsListItem,
    CsListItemDropdown,
    CsListItems,
  },
  data() {
    return {
      version: prettyVersion,
      currency: this.$currency,
      currencies: currencies.map((currency) => ({ value: currency, name: currency })),
      language: this.$i18n.locale,
      languages,
    };
  },
  computed: {
    securityPinTitle() {
      const { $t } = this;
      switch (this.$account.biometry.type) {
        case TYPES.BIOMETRICS:
          return $t('PIN & Biometrics');
        case TYPES.FINGERPRINT:
          return $t('PIN & Fingerprint');
        case TYPES.TOUCH_ID:
          return $t('PIN & Touch ID');
        case TYPES.FACE_ID:
          return $t('PIN & Face ID');
        default:
          return $t('PIN');
      }
    },
  },
  watch: {
    async currency(value, oldValue) {
      if (value === oldValue) {
        return;
      }
      this.$account.details.set('systemInfo', {
        ...this.$account.details.get('systemInfo'),
        preferredCurrency: value,
      });
      await this.$account.details.save();
      this.$account.emit('update', 'currency');
      this.$account.emit('update');
    },
    async language(value, oldValue) {
      if (value === oldValue) {
        return;
      }
      this.$account.details.set('systemInfo', {
        ...this.$account.details.get('systemInfo'),
        language: value,
      });
      await this.$account.details.save();
      this.$account.emit('update', 'language');
    },
  },
  methods: {
    support() {
      if (this.env.VITE_BUILD_TYPE === 'phonegap') {
        window.Zendesk.showHelpCenter(null, null, null, prettyVersion);
      } else {
        this.$safeOpen('https://support.coin.space/hc/en-us/sections/115000511287-FAQ');
      }
    },
    logout() {
      this.$account.logout();
      this.$router.replace({ name: 'auth' });
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Settings')">
    <div class="&__header">
      <CsAvatar
        class="&__header-avatar"
        :avatar="$user.avatar"
        :size="80"
        :alt="$t('Account')"
      />
      <div
        v-if="$user.username"
        class="&__header-username"
      >
        {{ $user.username }}
      </div>
      <CsButton
        class="&__header-button"
        type="primary-light"
        small
        @click="$router.push({ name: 'settings.account' })"
      >
        {{ $t('Edit') }}
      </CsButton>
    </div>
    <CsListItems :title="$t('General')">
      <CsListItem
        :title="$t('Local currency')"
      >
        <template #after>
          <CsListItemDropdown
            v-model="currency"
            :options="currencies"
          />
        </template>
      </CsListItem>
      <CsListItem
        :title="$t('Language')"
      >
        <template #after>
          <CsListItemDropdown
            v-model="language"
            :options="languages"
          />
        </template>
      </CsListItem>
    </CsListItems>

    <CsListItems :title="$t('Connections')">
      <CsListItem
        :title="$t('WalletConnect')"
        @click="$router.push({ name: 'settings.walletconnect' })"
      />
    </CsListItems>

    <CsListItems :title="$t('Security')">
      <CsListItem
        :title="securityPinTitle"
        @click="$router.push({ name: 'settings.pin' })"
      />
      <CsListItem
        :title="$t('Hardware security')"
        @click="$router.push({ name: 'settings.hardware' })"
      />
    </CsListItems>

    <CsListItems :title="$t('Support')">
      <CsListItem
        :title="$t('Support (English)')"
        @click="support"
      />
    </CsListItems>

    <CsListItems :title="$t('About')">
      <CsListItem
        :title="$t('Terms of Service')"
        @click="$safeOpen('https://coin.space/terms-of-service/')"
      />
      <CsListItem
        :title="$t('Privacy Policy')"
        @click="$safeOpen('https://coin.space/privacy-policy/')"
      />
    </CsListItems>

    <CsListItems>
      <CsListItem
        :arrow="false"
        type="danger"
        :title="$t('Log out')"
        class="&__logout"
        @click="logout"
      />
    </CsListItems>

    <div class="&__version">
      {{ version }}
    </div>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-lg;
    }

    &__header-avatar {
      width: $spacing-6xl;
      height: $spacing-6xl;
    }

    &__header-username {
      @include text-md;
      @include ellipsis;
      max-width: 100%;
    }

    &__version {
      @include text-sm;
      color: $secondary;
      text-align: center;
    }
  }
</style>
