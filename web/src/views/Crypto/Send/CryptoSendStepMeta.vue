<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import * as EOSErrors from '@coinspace/cs-eos-wallet/errors';
import * as RippleErrors from '@coinspace/cs-ripple-wallet/errors';
import * as StellarErrors from '@coinspace/cs-stellar-wallet/errors';
import * as TONErrors from '@coinspace/cs-toncoin-wallet/errors';

import { cryptoSubtitle } from '../../../lib/helpers.js';
import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
    CsFormTextareaReadonly,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  onShow() {
    if (this.storage.temp?.meta?.destinationTag) {
      this.meta.destinationTag = this.storage.temp.meta.destinationTag;
      this.storage.temp.meta.destinationTag = undefined;
    }
    if (this.storage.temp?.meta?.readonlyDestinationTag) {
      this.readonlyDestinationTag = this.storage.temp.meta.readonlyDestinationTag;
      this.storage.temp.meta.readonlyDestinationTag = undefined;
    }
  },
  data() {
    const meta = {};
    for (const name of this.$wallet.metaNames) {
      meta[name] = undefined;
    }
    return {
      isLoading: false,
      subtitle: cryptoSubtitle(this.$wallet),
      errors: {},
      metaNames: this.$wallet.metaNames,
      meta,
      readonlyDestinationTag: false,
    };
  },
  computed: {
    memoTitle() {
      if (this.$wallet.crypto.platform === 'stellar') {
        return this.$t('The memo contains optional extra information. A string up to 28-bytes long.');
      }
      if (this.$wallet.crypto.platform === 'eos') {
        return this.$t('The memo contains optional extra information. A string up to 256-bytes long.');
      }
      return this.$t('The memo contains optional extra information.');
    },
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      this.errors = {};
      try {
        const meta = {};
        for (const metaName of this.metaNames) {
          if (this.meta[metaName] !== undefined && this.meta[metaName] !== '') {
            meta[metaName] = this.meta[metaName];
          }
        }
        await this.$wallet.validateMeta({ address: this.storage.address, meta });
        this.updateStorage({ meta: this.meta });
        if (this.$wallet.isFeeRatesSupported) {
          this.next('fee');
        } else {
          this.next('amount');
        }
      } catch (err) {
        if (err instanceof EOSErrors.InvalidMemoError) {
          this.errors['memo'] = this.$t('Invalid Memo');
          return;
        }
        if (err instanceof StellarErrors.InvalidMemoError) {
          this.errors['memo'] = this.$t('Invalid Memo');
          return;
        }
        if (err instanceof TONErrors.InvalidMemoError) {
          this.errors['memo'] = this.$t('Invalid Memo');
          return;
        }
        if (err instanceof RippleErrors.InvalidDestinationTagError) {
          this.errors['destinationTag'] = this.$t('Invalid destination tag');
          return;
        }
        if (err instanceof RippleErrors.InvalidInvoiceIDError) {
          this.errors['invoiceId'] = this.$t('Invalid invoice ID');
          return;
        }
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
    :title="$t('Send {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__container">
      <CsFormInput
        v-if="metaNames.includes('destinationTag') && !readonlyDestinationTag"
        v-model="meta.destinationTag"
        :label="$t('Destination tag / memo')"
        :placeholder="$t('(optional)')"
        :info="$t('Destination tag / memo')"
        :error="errors.destinationTag"
        @update:modelValue="errors.destinationTag = undefined"
      >
        <template #info>
          <div>
            <!-- eslint-disable-next-line max-len -->
            {{ $t('An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.') }}
          </div>
        </template>
      </CsFormInput>
      <CsFormTextareaReadonly
        v-if="metaNames.includes('destinationTag') && readonlyDestinationTag"
        :value="meta.destinationTag"
        :label="$t('Destination tag / memo')"
        :info="$t('Destination tag / memo')"
      >
        <template #info>
          <div>
            <!-- eslint-disable-next-line max-len -->
            {{ $t('An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.') }}
          </div>
        </template>
      </CsFormTextareaReadonly>
      <CsFormInput
        v-if="metaNames.includes('invoiceId')"
        v-model="meta.invoiceId"
        :label="$t('Invoice ID')"
        :placeholder="$t('(optional)')"
        :info="$t('Invoice ID')"
        :error="errors.invoiceId"
        @update:modelValue="errors.invoiceId = undefined"
      >
        <template #info>
          <div>
            <!-- eslint-disable-next-line max-len -->
            {{ $t('A 256-bit hash that can be used to identify a particular payment.') }}
          </div>
        </template>
      </CsFormInput>
      <CsFormInput
        v-if="metaNames.includes('memo')"
        v-model="meta.memo"
        :label="$t('Memo')"
        :placeholder="$t('(optional)')"
        :info="$t('Memo')"
        :error="errors.memo"
        @update:modelValue="errors.memo = undefined"
      >
        <template #info>
          <div>
            {{ memoTitle }}
          </div>
        </template>
      </CsFormInput>
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Continue') }}
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
