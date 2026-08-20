<script>
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsCard from '../../components/CsCard.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

import ChevronLeftIcon from '../../assets/svg/chevronLeft.svg';
import ChevronRightIcon from '../../assets/svg/chevronRight.svg';
import TickIcon from '../../assets/svg/tick.svg';

export default {
  components: {
    MainLayout,
    CsCard,
    CsButton,
    CsButtonGroup,
    ChevronLeftIcon,
    ChevronRightIcon,
    TickIcon,
  },
  extends: CsStep,
  data() {
    return {
      products: this.args.products,
      selected: 0,
      agreement: false,
    };
  },
  computed: {
    product() {
      return this.products[this.selected];
    },
    description() {
      if (this.product.id === 'aurum') {
        return {
          text: this.$t('Built for active everyday global spending.'),
          list: [
            this.$t('Hong Kong Mastercard'),
            this.$t('Apple Pay & Google Pay'),
          ],
          link: `${this.$account.siteUrl}cards/#aurum`,
        };
      } else if (this.product.id === 'azure') {
        return {
          text: this.$t('Best for US users and USD payments.'),
          list: [
            this.$t('United States Mastercard'),
            this.$t('Apple Pay & Google Pay'),
          ],
          link: `${this.$account.siteUrl}cards/#azure`,
        };
      }
    },
    agreementLinkTexts() {
      return this.$tBrackets(this.$t('I agree to the {terms}((Card Service Terms))'));
    },
  },
  methods: {
    prevCard() {
      if (this.selected === 0) return;
      this.selected--;
    },
    nextCard() {
      if (this.selected === this.products.length - 1) return;
      this.selected++;
    },
    confirm() {
      this.updateStorage({
        product: this.product,
      });
      this.next('buy');
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Buy card')">
    <div class="&__wrapper">
      <CsButton
        v-if="products.length > 0"
        class="&__product-button"
        :class="{
          '&__product-button--disabled': selected === 0,
        }"
        @click="prevCard"
      >
        <ChevronLeftIcon class="rtl-mirror" />
      </CsButton>
      <CsCard
        :productId="product.id"
        size="medium"
      />
      <CsButton
        v-if="products.length > 0"
        class="&__product-button"
        :class="{
          '&__product-button--disabled': selected === products.length - 1,
        }"
        @click="nextCard"
      >
        <ChevronRightIcon class="rtl-mirror" />
      </CsButton>
    </div>
    <div class="&__content">
      <div class="&__title">
        {{ product.name }} · <span dir="ltr">{{ product.price }} {{ product.symbol }}</span>
      </div>
      <div class="&__description">
        {{ description.text }}
      </div>
      <ul class="&__description-list">
        <li
          v-for="item of description.list"
          :key="item"
        >
          {{ item }}
        </li>
      </ul>
      <CsButton
        type="primary-link"
        @click="$safeOpen(description.link)"
      >
        {{ $t('Read more') }}
      </CsButton>
    </div>
    <CsButtonGroup>
      <label class="&__agreement">
        <input
          v-model="agreement"
          type="checkbox"
          value="terms"
          class="&__default-checkbox"
        >
        <div class="&__checkbox">
          <TickIcon class="&__check" />
        </div>
        <i18n-t
          :keypath.camel="`[template] I agree to the {terms}((Card Service Terms))`"
          tag="span"
        >
          <template #terms>
            <a @click.prevent="$safeOpen(`${$account.siteUrl}terms-of-service/#card-service-terms`)">
              {{ agreementLinkTexts?.at(0) }}
            </a>
          </template>
        </i18n-t>
      </label>
      <CsButton
        type="primary"
        :disabled="agreement === false"
        @click="confirm"
      >
        {{ $t('Continue') }}
      </CsButton>
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__product-button {
      width: 3.5rem;
      height: 3.5rem;

      &--disabled {
        opacity: 0.4;
        pointer-events: none;
      }

      svg {
        width: var(--spacing-xl);
        height: var(--spacing-xl);
        margin: 0 auto;
      }
    }

    &__title {
      @include text-lg;
      @include text-bold;
    }

    &__description {
      @include text-md;
    }

    &__description-list {
      @include text-md;
      padding: 0;
      margin: 0;
      list-style-type: "·";
      padding-inline-start: var(--spacing-md);

      li {
        padding-inline-start: var(--spacing-sm);
      }
    }

    &__content {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: var(--spacing-md);
    }

    &__agreement {
      @include text-sm;
      position: relative;
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      gap: var(--spacing-md);
    }

    &__default-checkbox {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      &:checked ~ #{ $self }__checkbox {
        border: none;
        background-color: var(--color-primary-brand);
        #{ $self }__check {
          display: block;
        }
      }
    }

    &__checkbox {
      display: flex;
      width: var(--spacing-md);
      height: var(--spacing-md);
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--color-neutral);
      border-radius: 0.25rem;
      margin-top: var(--spacing-2xs);
    }

    &__check {
      display: none;
      width: var(--spacing-md);
      height: var(--spacing-md);

      [stroke] {
        stroke: var(--color-primary-button-text);
      }
    }
  }
</style>
