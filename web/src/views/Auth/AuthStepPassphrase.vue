<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsFormTextareaReadonly from '../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../components/CsStep.vue';

import DangerTriangleIcon from '../../assets/svg/dangerTriangle.svg';
import TickIcon from '../../assets/svg/tick.svg';

export default {
  components: {
    AuthStepLayout,
    CsButton,
    CsButtonGroup,
    CsFormTextareaReadonly,
    DangerTriangleIcon,
    TickIcon,
  },
  extends: CsStep,
  data() {
    return {
      isCopied: false,
      agreements: [],
    };
  },
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(this.storage.passphrase).then(() => {
        this.isCopied = true;
        setTimeout(() => {
          this.isCopied = false;
        }, 1000);
      }, () => {});
    },
  },
};
</script>

<template>
  <AuthStepLayout
    :title="$t('Your passphrase')"
    :description="$t('12 words')"
  >
    <div class="&__passphrase_wrapper">
      <CsFormTextareaReadonly
        class="&__passphrase"
        :value="storage.passphrase"
      />
      <CsButton
        class="&__copy"
        @click="copyToClipboard"
      >
        {{ isCopied ? $t('Copied!') : $t('Copy') }}
      </CsButton>
    </div>

    <div class="&__container">
      <div class="&__warning">
        <DangerTriangleIcon class="&__danger_triangle" />
        <!-- eslint-disable-next-line max-len -->
        {{ $t('Your passphrase will not be shown again. You will loose access to your wallet without the passphrase.') }}
      </div>

      <label class="&__agreement">
        <input
          v-model="agreements"
          type="checkbox"
          value="backup"
          class="&__default-checkbox"
        >
        <div class="&__checkbox">
          <TickIcon class="&__check" />
        </div>
        {{ $t('I have written down or otherwise securely stored my passphrase') }}
      </label>

      <label class="&__agreement">
        <input
          v-model="agreements"
          type="checkbox"
          value="terms"
          class="&__default-checkbox"
        >
        <div class="&__checkbox">
          <TickIcon class="&__check" />
        </div>
        {{ $t('I agree to the Terms of Service') }}
      </label>
    </div>

    <CsButtonGroup>
      <CsButton
        type="primary"
        :disabled="agreements.length !== 2"
        @click="next('passphraseConfirmation')"
      >
        {{ $t('Confirm') }}
      </CsButton>
      <CsButton
        type="primary-link"
        @click="$safeOpen('https://coin.space/terms-of-service/')"
      >
        {{ $t('View Terms of Service') }}
      </CsButton>
    </CsButtonGroup>
  </AuthStepLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__passphrase_wrapper {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $spacing-xs;
    }

    &__passphrase {
      @include text-bold;
    }

    &__copy {
      @include text-xs;
      justify-content: center;
      color: $secondary;
    }

    &__container {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
    }

    &__warning {
      @include text-sm;
      display: flex;
      align-items: flex-start;
      color: $danger;
      gap: $spacing-xs;
    }

    &__danger_triangle {
      width: $spacing-xl;
      flex-shrink: 0;
    }

    &__agreement {
      @include text-sm;
      position: relative;
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      gap: $spacing-md;
    }

    &__default-checkbox {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      &:checked ~ #{ $self }__checkbox {
        border: none;
        background-color: $primary-brand;
        #{ $self }__check {
          display: block;
        }
      }
    }

    &__checkbox {
      display: flex;
      width: $spacing-md;
      height: $spacing-md;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border: 1px solid $gray;
      border-radius: 0.25rem;
      margin-top: $spacing-2xs;
    }

    &__check {
      display: none;
      width: $spacing-md;
      height: $spacing-md;
    }
  }
</style>
