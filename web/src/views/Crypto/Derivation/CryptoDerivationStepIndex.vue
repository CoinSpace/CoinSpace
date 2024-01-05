<script>
import CsStep from '../../../components/CsStep.vue';

import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { objectsIsEqual } from '../../../lib/helpers.js';
import { walletSeed } from '../../../lib/mixins.js';

function isValidPath(path) {
  return /^m(\/\d+'?)*$/.test(path);
}

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
      isAddressTypesSupported: this.$wallet.isAddressTypesSupported,
      settings: this.$wallet.isAddressTypesSupported ? {
        bip84: this.$wallet.settings.bip84,
        bip49: this.$wallet.settings.bip49,
        bip44: this.$wallet.settings.bip44,
      } : {
        bip44: this.$wallet.settings.bip44,
      },
      errors: {},
    };
  },
  watch: {
    settings: {
      handler(value) {
        for (const key in value) {
          this.errors[key] = isValidPath(value[key]) ? false : this.$t('Invalid path');
        }
      },
      deep: true,
    },
  },
  methods: {
    async save() {
      this.isLoading = true;
      for (const key in this.settings) {
        if (!isValidPath(this.settings[key])) {
          this.errors[key] = this.$t('Invalid path');
          return this.isLoading = false;
        }
      }
      if (objectsIsEqual(this.settings, this.$wallet.settings)) return this.$router.up();

      await this.walletSeed(async (walletSeed) => {
        await this.$account.updatePlatformSettings(this.$wallet.crypto, this.settings, walletSeed);
        this.$router.up();
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Derivation path')">
    <div class="&__note">
      {{ $t('Derivation path defines how to derive private keys from passphrase.') }}
    </div>
    <CsFormGroup class="&__form">
      <template v-if="isAddressTypesSupported">
        <CsFormInput
          v-model="settings.bip84"
          :label="$t('Bech32 - SegWit native')"
          :error="errors.bip84"
          clear
        />
        <CsFormInput
          v-model="settings.bip49"
          :label="$t('P2SH - SegWit compatible')"
          :error="errors.bip49"
          clear
        />
        <CsFormInput
          v-model="settings.bip44"
          :label="$t('P2PKH - Legacy')"
          :error="errors.bip44"
          clear
        />
      </template>
      <CsFormInput
        v-else
        v-model="settings.bip44"
        :label="$t('Derivation path')"
        :error="errors.bip44"
        clear
      />
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="save"
    >
      {{ $t('Save') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__note {
      @include text-md;
    }

    &__form {
      flex-grow: 1;
    }
  }
</style>
