<script>
import { hex } from '@scure/base';

import CsButton from '../components/CsButton.vue';
import { TYPES } from '../lib/account/Biometry.js';
import { onShowOnHide } from '../lib/mixins.js';

import FaceIdSolidIcon from '../assets/svg/faceIdSolid.svg';
import TouchIdSolidIcon from '../assets/svg/touchIdSolid.svg';

export default {
  components: {
    CsButton,
    FaceIdSolidIcon,
    TouchIdSolidIcon,
  },
  mixins: [onShowOnHide],
  props: {
    mode: {
      type: String,
      default: 'setup', // deviceSeed, walletSeed
    },
    logoutButton: {
      type: Boolean,
      default: false,
    },
    onSuccess: {
      type: Function,
      default: undefined,
    },
  },
  data() {
    const { type, isEnabled } = this.$account.biometry;
    return {
      value: '',
      isLoading: false,
      isWrong: false,
      error: undefined,
      biometryIsEnabled: isEnabled && this.mode !== 'setup',
      biometryIcon: type === TYPES.FACE_ID ? 'FaceIdSolidIcon' : 'TouchIdSolidIcon',
    };
  },
  watch: {
    async value(value) {
      if (value.length === 4) {
        await this.confirm(value);
      }
    },
  },
  onShow() {
    if (this.biometryIsEnabled) {
      this.biometry();
    }
    window.addEventListener('keydown', this.keydown);
  },
  onHide() {
    window.removeEventListener('keydown', this.keydown);
  },
  methods: {
    enter(number) {
      if (this.isLoading) return;
      if (this.value.length === 4) return;
      this.value += number;
      this.error = undefined;
      window.taptic?.tap();
    },
    backspace() {
      if (this.isLoading) return;
      this.value = this.value.slice(0, -1);
      window.taptic?.tap();
    },
    keydown({ key }) {
      if (/\d/.test(key)) {
        this.enter(key);
      }
      if (key === 'Backspace') {
        this.backspace();
      }
    },
    logout() {
      this.$account.logout();
      this.$router.replace({ name: 'auth' });
    },

    async confirm(pin) {
      this.isLoading = true;
      try {
        switch (this.mode) {
          case 'setup':
            return await this.onSuccess(pin);
          case 'deviceSeed': {
            const pinHash = this.$account.pinHash(pin);
            const { deviceToken } = await this.$account.request({
              url: '/api/v4/token/device/pin',
              method: 'post',
              data: {
                pinHash,
              },
              id: true,
            });
            return await this.onSuccess(this.$account.getSeed('device', hex.decode(deviceToken)), pin);
          }
          case 'walletSeed': {
            const pinHash = this.$account.pinHash(pin);
            const res = await this.$account.request({
              url: '/api/v4/token/wallet/pin',
              method: 'post',
              data: {
                pinHash,
              },
              seed: 'device',
            });
            if (res.walletToken) {
              return await this.onSuccess(this.$account.getSeed('wallet', hex.decode(res.walletToken)), pin);
            }
            const walletToken = await this.$account.hardware.walletToken(res);
            if (!walletToken) return this.value = '';
            return await this.onSuccess(this.$account.getSeed('wallet', hex.decode(walletToken)), pin);
          }
        }
      } catch (err) {
        this._errorHandler(err);
      } finally {
        this.isLoading = false;
      }
    },

    async biometry() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.error = undefined;
      try {
        if (this.env.VITE_BUILD_TYPE === 'phonegap') {
          const pin = await this.$account.biometry.phonegap();
          if (!pin) return;
          return await this.confirm(pin);
        }
        switch (this.mode) {
          case 'deviceSeed': {
            const deviceToken = await this.$account.biometry.deviceToken();
            if (!deviceToken) return;
            return await this.onSuccess(this.$account.getSeed('device', hex.decode(deviceToken)));
          }
          case 'walletSeed': {
            const res = await this.$account.biometry.walletToken();
            if (!res) return;
            if (res.walletToken) {
              return await this.onSuccess(this.$account.getSeed('wallet', hex.decode(res.walletToken)));
            }
            const walletToken = await this.$account.hardware.walletToken(res);
            if (!walletToken) return;
            return await this.onSuccess(this.$account.getSeed('wallet', hex.decode(walletToken)));
          }
        }
      } catch (err) {
        this._errorHandler(err);
      } finally {
        this.isLoading = false;
      }
    },

    _errorHandler(error) {
      switch (error.status) {
        case 404:
        case 410:
          return this.logout();
        case 401:
          this.isWrong = true;
          this.value = '';
          setTimeout(() => {
            this.isWrong = false;
          }, 700);
          window.taptic?.error();
          break;
        default:
          this.error = this.$account?.isOnion
            ? this.$t('Error! Please ensure that your Tor VPN is active.')
            : this.$t('Error! Please try again later.');
          this.value = '';
          console.error(error);
      }
    },
  },
};
</script>

<template>
  <div
    class="&__dots"
    :class="{
      '&__dots--loading': isLoading,
      '&__dots--wrong': isWrong
    }"
  >
    <span
      v-if="error && !isLoading"
      class="&__error"
    >
      {{ error }}
    </span>
    <template v-else>
      <div
        class="&__dot"
        :class="{ '&__dot--active': value.length > 0 }"
      />
      <div
        class="&__dot"
        :class="{ '&__dot--active': value.length > 1 }"
      />
      <div
        class="&__dot"
        :class="{ '&__dot--active': value.length > 2 }"
      />
      <div
        class="&__dot"
        :class="{ '&__dot--active': value.length > 3 }"
      />
    </template>
  </div>
  <div class="&__keyboard">
    <div class="&__row">
      <CsButton
        v-for="(number) in [1, 2, 3]"
        :key="number"
        class="&__key"
        type="secondary"
        @click="enter(number)"
      >
        {{ number }}
      </CsButton>
    </div>
    <div class="&__row">
      <CsButton
        v-for="(number) in [4, 5, 6]"
        :key="number"
        type="secondary"
        class="&__key"
        @click="enter(number)"
      >
        {{ number }}
      </CsButton>
    </div>
    <div class="&__row">
      <CsButton
        v-for="(number) in [7, 8, 9]"
        :key="number"
        type="secondary"
        class="&__key"
        @click="enter(number)"
      >
        {{ number }}
      </CsButton>
    </div>
    <div class="&__row">
      <CsButton
        v-if="logoutButton"
        class="&__key &__key--named"
        @click="logout"
      >
        {{ $t('Log out') }}
      </CsButton>
      <div
        v-else
        class="&__key &__key--disabled"
      />
      <CsButton
        :key="0"
        class="&__key"
        type="secondary"
        @click="enter(0)"
      >
        0
      </CsButton>
      <CsButton
        v-if="value.length"
        class="&__key &__key--named"
        @click="backspace"
      >
        {{ $t('Delete') }}
      </CsButton>
      <CsButton
        v-else-if="biometryIsEnabled"
        class="&__key"
        @click="biometry"
      >
        <component
          :is="biometryIcon"
          class="&__biometry"
        />
      </CsButton>
      <div
        v-else
        class="&__key &__key--disabled"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__dots {
      display: flex;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
      gap: $spacing-lg;

      &--wrong {
        animation: shake-x 0.7s;
      }

      &--loading {
        #{ $self }__dot {
          background-color: $primary-brand;
        }
        #{ $self }__dot:nth-child(1) {
          animation: pulse-4 0.6s ease-in-out alternate infinite;
        }
        #{ $self }__dot:nth-child(2) {
          animation: pulse-4 0.6s ease-in-out alternate 0.2s infinite;
        }
        #{ $self }__dot:nth-child(3) {
          animation: pulse-4 0.6s ease-in-out alternate 0.4s infinite;
        }
        #{ $self }__dot:nth-child(4) {
          animation: pulse-4 0.6s ease-in-out alternate 0.6s infinite;
        }
      }
    }

    &__dot {
      width: $spacing-md;
      height: $spacing-md;
      border-radius: 50%;
      background-color: $gray;

      &--active {
        animation: scale-dot 0.2s;
        background-color: $primary-brand;
        opacity: 1;
      }
    }

    &__keyboard {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }

    &__row {
      display: flex;
      justify-content: center;
      gap: $spacing-lg;
    }

    &__key {
      @include text-xl;
      width: $spacing-6xl;
      height: $spacing-6xl;
      border-radius: 50%;
      font-weight: $font-weight-regular;

      &--disabled {
        background-color: transparent;
        pointer-events: none;
      }

      &--named {
        @include text-sm;
      }
    }

    &__biometry {
      height: $spacing-2xl;
      margin: 0 auto;
    }

    &__error {
      @include text-md;
    }
  }
</style>
