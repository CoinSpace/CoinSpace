<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import * as MoneroErrors from '@coinspace/cs-monero-wallet/errors';
import { walletSeed } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
      txId: '',
      error: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      this.error = undefined;
      try {
        await this.$wallet.validateTransaction(this.txId);
        await this.walletSeed(async (walletSeed) => {
          try {
            await this.$wallet.addTransaction(this.txId, walletSeed);
            this.$account.emit('update');
            this.updateStorage({ status: true });
          } catch (err) {
            this.updateStorage({ status: false, error: err });
          }
          this.next('moneroStatus');
        });
      } catch (err) {
        if (err instanceof MoneroErrors.InvalidTransactionIDError) {
          return this.error = this.$t('Invalid transaction ID');
        }
        if (err instanceof MoneroErrors.TransactionAlreadyAddedError) {
          return this.error = this.$t('Transaction has already been accepted');
        }
        if (err instanceof MoneroErrors.UnknownTransactionError) {
          // eslint-disable-next-line max-len
          return this.error = this.$t('Transaction not found or has less than 10 confirmations. Please wait 20 minutes and try again.');
        }
        this.error = this.$account.unknownError();
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Accept transaction')">
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="txId"
        :label="$t('Transaction ID')"
        :error="error"
        clear
        :info="$t('Accept transaction')"
        @update:modelValue="error = undefined"
      >
        <template #info>
          <div>
            {{ $t('Only transactions addressed to you can be accepted. The minimum number of confirmations is 10.') }}
          </div>
        </template>
        <template #infoFooter>
          <CsButtonGroup>
            <CsButton
              type="primary-link"
              @click="$safeOpen('https://support.coin.space/hc/en-us/articles/4403046925204')"
            >
              {{ $t('Read more') }}
            </CsButton>
          </CsButtonGroup>
        </template>
      </CsFormInput>
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Accept') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }
  }
</style>
