<script>
import CsFormElement from './CsFormElement.vue';

import CopyIcon from '../../assets/svg/copy.svg';
import TickIcon from '../../assets/svg/tick.svg';

export default {
  components: {
    CsFormElement,
    CopyIcon,
    TickIcon,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    copyValue: {
      type: String,
      default: undefined,
    },
    copy: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: '',
    },
    info: {
      type: [Boolean, String],
      default: false,
    },
    writable: {
      type: Boolean,
      default: false,
    },
    inheritDir: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isCopied: false,
    };
  },
  methods: {
    onCopy() {
      navigator.clipboard.writeText(this.copyValue || this.value).then(() => {
        this.isCopied = true;
        setTimeout(() => {
          this.isCopied = false;
        }, 1000);
      }, () => {});
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    v-bind="$props"
  >
    <div
      v-if="$slots.before"
      class="&__icon-before"
    >
      <slot name="before" />
    </div>
    <div
      class="&__textarea"
      lang="en"
    >
      {{ value }}
    </div>
    <div
      v-if="$slots.after && copy === false"
      class="&__icon-after"
    >
      <slot name="after" />
    </div>
    <div
      v-else-if="copy"
      class="&__icon-after"
    >
      <TickIcon
        v-if="isCopied"
        class="&__success"
      />
      <CopyIcon
        v-else
        class="&__copy"
        @click="onCopy"
      />
    </div>

    <template #info>
      <slot name="info" />
    </template>
    <template
      v-if="$slots.infoFooter"
      #infoFooter
    >
      <slot name="infoFooter" />
    </template>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__textarea {
      @include text-md;
      overflow: hidden;
      flex-grow: 1;
      padding: var(--spacing-sm) 0;
      border: none;
      background-color: transparent;
      color: var(--color-text);
      cursor: auto;
      font-family: inherit;
      line-height: inherit;
      overflow-wrap: break-word;
    }

    &__icon-before,
    &__icon-after {
      width: var(--spacing-xl);
      height: var(--spacing-xl);
      flex-shrink: 0;
      align-self: start;
      margin: calc(1rem - 1px) 0;
      margin: calc(--spacing-md - 1px) 0;
    }

    &__copy {
      cursor: pointer;
    }

    &__success {
      [stroke] {
        stroke: var(--color-primary);
      }
    }
  }
</style>
