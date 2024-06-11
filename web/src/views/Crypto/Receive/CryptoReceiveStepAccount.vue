<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { isValidUsername } from '../../../lib/helpers.js';

import { RequestError } from '../../../lib/account/Request.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      username: this.$user.username,
      errors: {},
    };
  },
  watch: {
    username(username) {
      if (username === undefined || isValidUsername(username)) {
        this.errors.username = undefined;
      } else {
        this.errors.username = this.$t('Invalid username');
      }
    },
  },
  methods: {
    async save() {
      if (!isValidUsername(this.username)) {
        this.errors.username = this.$t('Invalid username');
        return;
      }
      this.isLoading = true;
      this.errors = {};
      try {
        this.username = await this.$account.updateUsername(this.username);
        this.$account.details.set('userInfo', {
          username: this.username,
          email: this.$user.email,
        });
        await this.$account.details.save();
        this.$account.emit('update', 'user');
        this.back();
      } catch (err) {
        if (err instanceof RequestError && err.status === 400) {
          this.errors.username = this.$t('Username already taken');
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
  <MainLayout :title="$t('Account')">
    <div class="&__info">
      {{ $t('Before you start using Mecto, you need to enter a name that will help others identify you.') }}
    </div>
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="username"
        :label="$t('Your username')"
        :error="errors.username"
        :clear="true"
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
    $self: &;

    &__info {
      @include text-md;
    }

    &__container {
      flex-grow: 1;
    }
  }
</style>
