<script>
import CsFormElement from './CsFormElement.vue';
import TrailingIcon from '../../assets/svg/trailing.svg';

const pad = (n) => String(n).padStart(2, '0');
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default {
  components: { CsFormElement, TrailingIcon },
  props: {
    modelValue: { type: String, default: '' }, // YYYY-MM-DD
    maxYear: {
      type: Number,
      default: () => {
        return (new Date()).getFullYear() - 18;
      },
    },
    minYear: {
      type: Number,
      default: () => {
        return (new Date()).getFullYear() - 140;
      },
    },
    label: {
      type: String,
      default: undefined,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    const [year = '', month = '', day = ''] = this.modelValue ? this.modelValue.split('-') : [];
    return { day, month, year };
  },
  computed: {
    years() {
      let years = range(this.minYear, this.maxYear);
      if (this.maxYear < (new Date()).getFullYear()) {
        years = years.reverse();
      }
      return years.map((year) => ({ value: String(year), name: String(year) }));
    },
    months() {
      return range(1, 12).map((month) => ({
        value: pad(month),
        name: this.$d(new Date(2000, month - 1, 1), 'monthOnly'),
      }));
    },
    days() {
      const year = Number(this.year) || 2000;
      const count = this.month ? new Date(year, Number(this.month), 0).getDate() : 31;
      return range(1, count).map((day) => ({ value: pad(day), name: String(day) }));
    },
  },
  methods: {
    select(key, value) {
      this[key] = value;
      if (key !== 'day' && this.day && !this.days.some((day) => day.value === this.day)) {
        this.day = '';
      }
      const result = this.day && this.month && this.year ? `${this.year}-${this.month}-${this.day}` : '';
      this.$emit('update:modelValue', result);
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    v-bind="$props"
  >
    <template #boxes>
      <div
        v-for="box in [
          { key: 'day', options: days },
          { key: 'month', options: months },
          { key: 'year', options: years },
        ]"
        :key="box.key"
        :class="`&__${box.key}`"
      >
        <div class="&__value">
          {{ (box.options.find((option) => option.value === this[box.key]) || {}).name }}
        </div>
        <select
          class="&__select"
          :value="this[box.key]"
          @change="select(box.key, $event.target.value)"
        >
          <option
            v-for="option in box.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.name }}
          </option>
        </select>
        <div class="&__icon-after">
          <TrailingIcon />
        </div>
      </div>
    </template>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__day {
      max-width: 5.25rem;
    }

    &__year {
      max-width: 6.75rem;
    }

    &__value {
      @include ellipsis;
      flex-grow: 1;
    }

    &__select {
      @include text-md;
      @include transparent-stretch;
    }

    &__icon-after {
      width: var(--spacing-xl);
      height: var(--spacing-xl);
      flex-shrink: 0;
    }
  }
</style>
