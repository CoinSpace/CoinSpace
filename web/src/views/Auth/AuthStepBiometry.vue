<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsStep from '../../components/CsStep.vue';

import FaceIdIcon from '../../assets/svg/faceId.svg';
import TouchIdIcon from '../../assets/svg/touchId.svg';

import { TYPES } from '../../lib/account/Biometry.js';
import { redirectToApp } from '../../lib/mixins.js';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    AuthStepLayout,
    TouchIdIcon,
    FaceIdIcon,
  },
  extends: CsStep,
  mixins: [redirectToApp],
  data() {
    const { type } = this.$account.biometry;
    const { $t } = this;
    const CONFIG = {
      [TYPES.BIOMETRICS]: {
        title: $t('Biometrics'),
        text: $t('Use Biometrics instead of PIN.'),
        icon: 'TouchIdIcon',
      },
      [TYPES.FINGERPRINT]: {
        title: $t('Fingerprint'),
        text: $t('Use Fingerprint instead of PIN.'),
        icon: 'TouchIdIcon',
      },
      [TYPES.TOUCH_ID]: {
        title: 'Touch ID',
        text: $t('Use Touch ID instead of PIN.'),
        icon: 'TouchIdIcon',
      },
      [TYPES.FACE_ID]: {
        title: 'Face ID',
        text: $t('Use Face ID instead of PIN.'),
        icon: 'FaceIdIcon',
      },
    };
    const { title, text, icon } = CONFIG[type];
    return {
      isLoading: false,
      title,
      text,
      icon,
      buttonLabel: $t('Enable') + ' ' + title,
    };
  },
  methods: {
    async setup() {
      this.isLoading = true;
      const result = await this.$account.biometry.enable(this.storage.pin, this.storage.seed);
      if (!result) return this.isLoading = false;
      this.done();
    },
    done() {
      if (this.$account.cryptosToSelect) {
        this.next('selectCryptos');
      } else {
        this.redirectToApp();
      }
    },
  },
};
</script>

<template>
  <AuthStepLayout
    :title="title"
    @back="done"
  >
    <div class="&__icon-wrapper">
      <component
        :is="icon"
        class="&__icon"
      />
    </div>
    <div class="&__text">
      {{ text }}
    </div>
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="setup"
      >
        {{ buttonLabel }}
      </CsButton>
      <CsButton
        type="primary-link"
        @click="done"
      >
        {{ $t('Skip') }}
      </CsButton>
    </CsButtonGroup>
  </AuthStepLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__icon-wrapper {
      display: flex;
      flex-grow: 1;
      justify-content: center;
    }

    &__icon {
      width: var(--spacing-8xl);
    }

    &__text {
      @include text-md;
    }
  }
</style>
