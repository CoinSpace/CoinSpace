<script>
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';

import PlusIcon from '../../assets/svg/plus.svg';
import SendIcon from '../../assets/svg/send.svg';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    PlusIcon,
    SendIcon,
  },
  data() {
    return {
      isLoading: {
        primary: false,
        secondary: false,
        primaryLight: false,
        dangerLight: false,
      },
    };
  },
  methods: {
    click(type) {
      this.isLoading[type] = true;
      setTimeout(() => {
        this.isLoading[type] = false;
      }, 3000);
    },
  },
};
</script>

<template>
  <div class="&">
    <CsButton
      type="primary"
      :isLoading="isLoading.primary"
      @click="click('primary')"
    >
      Primary
    </CsButton>

    <CsButton
      type="secondary"
      :isLoading="isLoading.secondary"
      @click="click('secondary')"
    >
      Secondary
    </CsButton>

    <CsButton
      type="primary-light"
      :isLoading="isLoading.primaryLight"
      @click="click('primaryLight')"
    >
      Primary light
    </CsButton>

    <CsButton
      type="danger-light"
      :isLoading="isLoading.dangerLight"
      @click="click('dangerLight')"
    >
      Danger light
    </CsButton>

    <CsButton type="primary-link">
      Primary link
    </CsButton>

    <CsButton type="danger-link">
      Danger link
    </CsButton>

    <CsButton
      type="primary"
      disabled
    >
      Disabled
    </CsButton>

    <CsButton
      type="primary"
      small
    >
      Small
    </CsButton>

    <CsButton type="primary-light">
      <PlusIcon />
      Icon + Text
    </CsButton>

    <CsButton
      type="primary-light"
      title="Icon button"
    >
      <PlusIcon />
    </CsButton>

    <CsButton class="&__custom-button">
      Custom
    </CsButton>

    <CsButton
      type="primary-link"
    >
      <PlusIcon />
      Icon + Text
    </CsButton>

    <CsButton
      small
      type="primary-link"
    >
      <PlusIcon />
      Icon + Text (Small)
    </CsButton>

    <CsButton
      class="&__custom-button"
      title="Custom icon button"
    >
      <PlusIcon />
    </CsButton>

    <CsButton
      class="&__multiline"
      type="primary-light"
    >
      <PlusIcon /> Maximum two lines here 😎 <PlusIcon />
    </CsButton>

    <CsButton
      type="primary-light"
      small
    >
      <PlusIcon /> Small + 2 Icons 😎 <PlusIcon />
    </CsButton>

    <CsButtonGroup type="circle">
      <CsButton
        type="circle"
      >
        <template #circle>
          <SendIcon />
        </template>
        Send
      </CsButton>
      <CsButton
        type="circle"
      >
        <template #circle>
          <SendIcon />
        </template>
        Exchange
      </CsButton>
      <CsButton
        type="circle"
      >
        <template #circle>
          <SendIcon />
        </template>
        Receive
      </CsButton>
      <CsButton
        type="circle"
      >
        <template #circle>
          <SendIcon />
        </template>
        History longwordheretitle
      </CsButton>
    </CsButtonGroup>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    .cs-button {
      margin-bottom: $spacing-xl;
    }

    &__custom-button {
      svg {
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    &__multiline {
      width: 300px;
    }
  }
</style>
