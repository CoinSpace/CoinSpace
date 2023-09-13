<script>
import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { RequestError } from '../../../lib/account/Request.js';
import {
  isValidEmail,
  isValidUsername,
} from '../../../lib/helpers.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      username: this.$user.username,
      email: this.$user.email,
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
    email(email) {
      if (!email || isValidEmail(email)) {
        this.errors.email = undefined;
      } else {
        this.errors.email = this.$t('Invalid email');
      }
    },
  },
  methods: {
    async save() {
      if (!isValidUsername(this.username)) {
        this.errors.username = this.$t('Invalid username');
        return;
      }
      if (this.email && !isValidEmail(this.email)) {
        this.errors.email = this.$t('Invalid email');
        return;
      }
      this.isLoading = true;
      try {
        this.username = await this.$account.updateUsername(this.username);
        this.errors = {};
        this.$account.details.set('userInfo', {
          username: this.username,
          email: this.email,
        });
        await this.$account.details.save();
        this.$account.emit('update', 'user');
        this.$router.up();
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
  <MainLayout
    :title="$t('Account')"
  >
    <CsFormGroup class="&__content">
      <CsFormInput
        v-model="username"
        :error="errors.username"
        :label="$t('Your username')"
      />
      <CsFormInput
        v-model="email"
        :error="errors.email"
        :label="$t('Gravatar email')"
      />
      <div class="&__note">
        <!-- eslint-disable-next-line max-len -->
        {{ $t('Gravatar (globally recognised avatar) is a service that lets you re-use the same avatar across websites and apps by specifying an email address.') }}
        <a @click="$safeOpen('https://gravatar.com/')">{{ $t('Create Gravatar.') }}</a>
      </div>
    </CsFormGroup>
    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="save"
      >
        {{ $t('Save') }}
      </CsButton>
      <CsButton
        type="danger-link"
        @click="next('remove')"
      >
        {{ $t('Remove account') }}
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
