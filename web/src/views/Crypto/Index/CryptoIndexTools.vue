<script>
import CsListItem from '../../../components/CsListItem.vue';
import CsListItems from '../../../components/CsListItems.vue';

import DeleteIcon from '../../../assets/svg/delete.svg';
import DerivationIcon from '../../../assets/svg/derivation.svg';
import ExportIcon from '../../../assets/svg/export.svg';
import ImportIcon from '../../../assets/svg/import.svg';
import InfoIcon from '../../../assets/svg/info.svg';
import StakingIcon from '../../../assets/svg/staking.svg';

export default {
  components: {
    CsListItems,
    CsListItem,
    ImportIcon,
    ExportIcon,
    DerivationIcon,
    InfoIcon,
    DeleteIcon,
    StakingIcon,
  },
  emits: ['remove'],
  data() {
    return {
      isExportSupported: this.$wallet.isExportSupported || this.$wallet.crypto?.platform === 'tron',
      isImportSupported: this.$wallet.isImportSupported,
      isSettingsSupported: this.$wallet.isSettingsSupported,
      isStakingSupported: this.$wallet.isStakingSupported,
    };
  },
};
</script>

<template>
  <CsListItems class="&">
    <template v-if="$walletState === $STATE_LOADED || $walletState === $STATE_LOADING">
      <CsListItem
        v-if="$showRampsAndExchangeAndStaking && isStakingSupported"
        :disabled="$walletState === $STATE_LOADING"
        :title="$t('Staking')"
        @click="$router.push({ name: 'crypto.staking', params: { cryptoId: $wallet.crypto._id }})"
      >
        <template #before>
          <StakingIcon />
        </template>
      </CsListItem>
      <CsListItem
        v-if="isImportSupported"
        :disabled="$walletState === $STATE_LOADING"
        :title="$t('Transfer private key')"
        @click="$router.push({ name: 'crypto.import', params: { cryptoId: $wallet.crypto._id }})"
      >
        <template #before>
          <ImportIcon />
        </template>
      </CsListItem>
      <CsListItem
        v-if="isExportSupported && $wallet.crypto?.platform !== 'tron'"
        :disabled="$walletState === $STATE_LOADING"
        :title="$t('Export private keys')"
        @click="$router.push({ name: 'crypto.export', params: { cryptoId: $wallet.crypto._id }})"
      >
        <template #before>
          <ExportIcon />
        </template>
      </CsListItem>

      <template v-if="isExportSupported && $wallet.crypto?.platform === 'tron'">
        <CsListItem
          :disabled="$walletState === $STATE_LOADING"
          :title="$t('Export private keys')"
          :description="$t('Selected account')"
          @click="$router.push({
            name: 'crypto.export',
            params: { cryptoId: $wallet.crypto._id },
            query: { ...$route.query, scope: 'current' },
          })"
        >
          <template #before>
            <ExportIcon />
          </template>
        </CsListItem>
        <CsListItem
          :disabled="$walletState === $STATE_LOADING"
          :title="$t('Export private keys')"
          :description="$t('All accounts')"
          @click="$router.push({
            name: 'crypto.export',
            params: { cryptoId: $wallet.crypto._id },
            query: { ...$route.query, scope: 'all' },
          })"
        >
          <template #before>
            <ExportIcon />
          </template>
        </CsListItem>
      </template>
      <CsListItem
        v-if="isSettingsSupported"
        :disabled="$walletState === $STATE_LOADING"
        :title="$t('Derivation path')"
        @click="$router.push({ name: 'crypto.derivation', params: { cryptoId: $wallet.crypto._id }})"
      >
        <template #before>
          <DerivationIcon />
        </template>
      </CsListItem>
      <CsListItem
        v-if="$wallet.crypto.type === 'token'"
        :disabled="$walletState === $STATE_LOADING"
        :title="$t('Token info')"
        @click="$router.push({ name: 'crypto.info', params: { cryptoId: $wallet.crypto._id }})"
      >
        <template #before>
          <InfoIcon />
        </template>
      </CsListItem>
    </template>

    <CsListItem
      :title="$t('Remove')"
      type="danger"
      :arrow="false"
      :disabled="$walletState === $STATE_LOADING"
      @click="$emit('remove')"
    >
      <template #before>
        <DeleteIcon />
      </template>
    </CsListItem>
  </CsListItems>
</template>

<style lang="scss">
  .#{ $filename } {
    @include breakpoint(lg) {
      display: none;
    }
  }
</style>
