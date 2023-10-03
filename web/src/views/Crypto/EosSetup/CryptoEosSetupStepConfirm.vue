<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInputReadonly from '../../../components/CsForm/CsFormInputReadonly.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInputReadonly,
    CsFormTextareaReadonly,
    MainLayout,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      error: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      const data = await this.$wallet.setupAccount(this.storage.account);
      if (data.needToCreateAccount === false) {
        this.error = undefined;
        this.$router.up();
      } else {
        this.error = this.$t('Transfer not found');
      }
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Setup EOS account')"
  >
    <CsFormGroup class="&__content">
      <div class="&__note">
        <!-- eslint-disable-next-line max-len -->
        {{ $t('To create a new account you need to make an EOS transfer (amount greater than {price} EOS) with the following data from an exchange or other EOS wallet.', {
          price: storage.price,
        }) }}
      </div>
      <CsFormInputReadonly
        value="coinappsetup"
        :label="$t('Account')"
      />
      <CsFormTextareaReadonly
        :value="storage.memo"
        :label="$t('Memo')"
      />
      <div class="&__note">
        {{ $t('The extra amount will be deposited to the created account.') }}
      </div>
    </CsFormGroup>
    <div
      v-if="error"
      class="&__error"
    >
      {{ error }}
    </div>
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Confirm') }}
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

    &__error {
      @include text-md;
      color: $danger;
    }
  }
</style>