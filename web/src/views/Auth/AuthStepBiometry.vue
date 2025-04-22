<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsStep from '../../components/CsStep.vue';

import FaceIdIcon from '../../assets/svg/faceId.svg';
import TouchIdIcon from '../../assets/svg/touchId.svg';

import { TYPES } from '../../lib/account/Biometry.js';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    AuthStepLayout,
    TouchIdIcon,
    FaceIdIcon,
  },
  extends: CsStep,
  data() {
    const { type } = this.$account.biometry;
    const { $t } = this;
    const ENABLE = $t('Enable') + ' ';
    switch (type) {
      case TYPES.BIOMETRICS:
        return {
          title: $t('Biometrics'),
          text: $t('Use Biometrics instead of PIN.'),
          buttonLabel: ENABLE + $t('Biometrics'),
          icon: 'TouchIdIcon',
        };
      case TYPES.FINGERPRINT:
        return {
          title: $t('Fingerprint'),
          text: $t('Use Fingerprint instead of PIN.'),
          buttonLabel: ENABLE + $t('Fingerprint'),
          icon: 'TouchIdIcon',
        };
      case TYPES.TOUCH_ID:
        return {
          title: 'Touch ID',
          text: $t('Use Touch ID instead of PIN.'),
          buttonLabel: ENABLE + 'Touch ID',
          icon: 'TouchIdIcon',
        };
      case TYPES.FACE_ID:
        return {
          title: 'Face ID',
          text: $t('Use Face ID instead of PIN.'),
          buttonLabel: ENABLE + 'Face ID',
          icon: 'FaceIdIcon',
        };
    }
  },
  methods: {
    async setup() {
      const result = await this.$account.biometry.enable(this.storage.pin, this.storage.seed);
      if (!result) return;
      this.done();
    },
    done() {
      if (this.$account.isNewWallet) {
        this.next('selectCryptos');
      } else if (this.$account.newCryptosToShow.length) {
        this.next('newCryptos');
      } else if (this.$route.redirectedFrom && this.$route.redirectedFrom.name !== 'home') {
        this.$router.push(this.$route.redirectedFrom);
      } else {
        this.$router.replace({ name: 'home' });
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
      width: $spacing-8xl;
    }

    &__text {
      @include text-md;
    }
  }
</style>
