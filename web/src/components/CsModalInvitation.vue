<script>
import { isValidEmail } from '../lib/helpers.js';

import CsButton from './CsButton.vue';
import CsButtonGroup from './CsButtonGroup.vue';
import CsFormGroup from './CsForm/CsFormGroup.vue';
import CsFormInput from './CsForm/CsFormInput.vue';
import CsModal from './CsModal.vue';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
    CsModal,
  },
  props: {
    show: Boolean,
  },
  emits: ['close'],
  data() {
    return {
      email: this.$user.email,
      error: undefined,
      isLoading: false,
    };
  },
  methods: {
    async send() {
      if (!isValidEmail(this.email)) return this.error = this.$t('Invalid email');
      this.isLoading = true;
      this.error = undefined;
      try {
        await this.$account.sendInvitation(this.email);
        this.$emit('close');
      } catch (err) {
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
  <CsModal
    :show="show"
    :title="$t('Write a review')"
    @close="$emit('close')"
  >
    <CsFormGroup>
      <div>
        {{ $t('A link to the review form will be sent to your email.') }}
      </div>
      <CsFormInput
        v-model="email"
        :error="error"
        :label="$t('Your email')"
        :clear="true"
        @update:modelValue="error = undefined"
      />
    </CsFormGroup>

    <template #footer>
      <CsButtonGroup>
        <CsButton
          type="primary"
          :isLoading="isLoading"
          @click="send"
        >
          {{ $t('Send') }}
        </CsButton>
      </CsButtonGroup>
    </template>
  </CsModal>
</template>
