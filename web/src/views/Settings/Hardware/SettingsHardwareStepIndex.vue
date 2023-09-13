<script>
import CsButton from '../../../components/CsButton.vue';
import CsListItem from '../../../components/CsListItem.vue';
import CsListItems from '../../../components/CsListItems.vue';
import CsLoader from '../../../components/CsLoader.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { walletSeed } from '../../../lib/mixins.js';

import DeleteIcon from '../../../assets/svg/delete.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    CsListItem,
    CsListItems,
    CsLoader,
    DeleteIcon,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      MAX_AUTHENTICATORS: 10,
      isLoading: true,
      isAdding: false,
      keys: [],
    };
  },
  async mounted() {
    await this.loadKeys();
  },
  methods: {
    async add() {
      this.isAdding = true;
      await this.walletSeed(async (walletSeed) => {
        const result = await this.$account.hardware.add(walletSeed);
        if (result) await this.loadKeys();
      }, { keepStep: true });
      this.isAdding = false;
    },
    remove(credentialID) {
      this.next('passphrase', { credentialID, loadKeys: this.loadKeys });
    },
    async loadKeys() {
      this.isLoading = true;
      this.keys = (await this.$account.hardware.list()).map((item) => {
        return {
          ...item,
          name: this.$d(new Date(item.date), 'hardware').replace(',', ''),
        };
      });
      this.$account.settings.clientSet('hasAuthenticators', this.keys.length !== 0);
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Hardware security')">
    <CsLoader v-if="isLoading" />
    <template v-else>
      <CsListItems
        v-if="keys.length"
        :title="$t('Hardware keys')"
      >
        <CsListItem
          v-for="item in keys"
          :key="item.credentialID"
          :title="item.name"
          :arrow="false"
        >
          <template #after>
            <CsButton @click="remove(item.credentialID)">
              <DeleteIcon />
            </CsButton>
          </template>
        </CsListItem>
      </CsListItems>
      <CsButton
        v-if="keys.length < MAX_AUTHENTICATORS"
        type="primary-light"
        :isLoading="isAdding"
        @click="add"
      >
        {{ $t('Add hardware key') }}
      </CsButton>
    </template>
  </MainLayout>
</template>
