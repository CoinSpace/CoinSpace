<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import * as EOSErrors from '@coinspace/cs-eos-wallet/errors';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
    MainLayout,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      account: '',
      error: undefined,
    };
  },
  watch: {
    account(value) {
      if (!value || this.$wallet.validateAccountName(value)) {
        this.error = undefined;
      } else {
        this.error = this.$t('Invalid account name');
      }
    },
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      this.error = undefined;
      try {
        const data = await this.$wallet.setupAccount(this.account);
        if (data.needToCreateAccount === false) {
          this.isLoading = false;
          this.$router.up();
        } else {
          this.updateStorage({
            account: this.account,
            memo: data.memo,
            price: data.price,
          });
          this.next('confirm');
        }
      } catch (err) {
        if (err instanceof EOSErrors.InvalidAccountNameError) {
          return this.error = this.$t('Invalid account name');
        }
        if (err instanceof EOSErrors.AccountNameUnavailableError) {
          return this.error = this.$t('This account name is already taken, please choose another one.');
        }
        this.error = this.$t('Error! Please try again later.');
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Setup EOS account')"
  >
    <CsFormGroup class="&__content">
      <CsFormInput
        v-model="account"
        :label="$t('Account name')"
        :error="error"
        clear
      />
      <div class="&__note">
        <!-- eslint-disable-next-line max-len -->
        {{ $t('The EOS account name must be exactly 12-character long and consist of lower case letters and digits from 1 to 5.') }}
      </div>
    </CsFormGroup>
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Continue') }}
      </CsButton>
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__content {
      flex-grow: 1;
    }

    &__note {
      @include text-md;
    }
  }
</style>
