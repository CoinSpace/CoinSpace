<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import PasteIcon from '../../../assets/svg/paste.svg';
import QrIcon from '../../../assets/svg/qr.svg';

import { isQrScanAvailable } from '../../../lib/helpers.js';
import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
    PasteIcon,
    QrIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    if (this.storage.uri) {
      this.error = undefined;
      this.uri = this.storage.uri;
      this.storage.uri = undefined;
    }
    this.isQrScanAvailable = await isQrScanAvailable();
  },
  data() {
    return {
      isLoading: false,
      isPasteAvailable: typeof navigator.clipboard?.readText === 'function',
      isQrScanAvailable: false,
      uri: '',
      error: undefined,
    };
  },
  methods: {
    async connect() {
      this.isLoading = true;
      this.error = undefined;
      try {
        const walletConnect = await this.$account.walletConnect();
        const proposal = await walletConnect.pair(this.uri);
        const session = await walletConnect.approveSession(proposal);
        this.updateStorage({ session });
        this.next('main');
      } catch (err) {
        if (err.message?.startsWith?.('Missing or invalid. pair() uri')) {
          this.error = this.$t('Invalid URI');
          return;
        }
        if (err.message?.includes?.('Please try again with a new connection URI')) {
          this.error = this.$t('Please try again with a new connection URI');
          return;
        }
        if (err.message?.includes?.('Non conforming namespaces')) {
          this.error = this.$t('Not supported');
          return;
        }
        if (err.message?.includes?.('Not supported')) {
          this.error = this.$t('Not supported');
          return;
        }
        this.error = this.$t('Error! Please try again later.');
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    paste() {
      navigator.clipboard.readText()
        .then((text) => {
          this.error = undefined;
          this.uri = text;
        }, () => {});
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('WalletConnect')"
  >
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="uri"
        :label="$t('WalletConnect URI')"
        :error="error"
        :clear="true"
        @update:modelValue="error = undefined"
      />

      <CsButtonGroup
        class="&__actions"
        type="circle"
      >
        <CsButton
          v-if="isPasteAvailable"
          type="circle"
          @click="paste"
        >
          <template #circle>
            <PasteIcon />
          </template>
          {{ $t('Paste') }}
        </CsButton>
        <CsButton
          v-if="isQrScanAvailable"
          type="circle"
          @click="next('qr')"
        >
          <template #circle>
            <QrIcon />
          </template>
          {{ $t('Scan QR') }}
        </CsButton>
      </CsButtonGroup>
    </CsFormGroup>
    <CsButtonGroup class="&__buttons">
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="connect"
      >
        {{ $t('Connect') }}
      </CsButton>
      <CsButton
        type="primary-link"
        @click="$safeOpen('https://support.coin.space/hc/en-us/articles/27563411040404')"
      >
        {{ $t('What is WalletConnect?') }}
      </CsButton>
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }

    &__actions {
      width: 100%;
      max-width: 25rem;
      align-self: center;
    }

    &__buttons {
      flex-shrink: 0;
    }
  }
</style>
