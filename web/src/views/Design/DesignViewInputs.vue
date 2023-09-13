<script>
import { Amount } from '@coinspace/cs-common';

import CsAmountInput from '../../components/CsAmountInput.vue';
import CsFormAmountInput from '../../components/CsForm/CsFormAmountInput.vue';
import CsFormBigIntInput from '../../components/CsForm/CsFormBigIntInput.vue';
import CsFormDropdown from '../../components/CsForm/CsFormDropdown.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsFormInputReadonly from '../../components/CsForm/CsFormInputReadonly.vue';
import CsFormSelect from '../../components/CsForm/CsFormSelect.vue';
import CsFormTextarea from '../../components/CsForm/CsFormTextarea.vue';
import CsFormTextareaReadonly from '../../components/CsForm/CsFormTextareaReadonly.vue';
import CsSwitch from '../../components/CsSwitch.vue';

import SearchIcon from '../../assets/svg/search.svg';

export default {
  components: {
    CsAmountInput,
    CsFormAmountInput,
    CsFormBigIntInput,
    CsFormDropdown,
    CsFormInput,
    CsFormInputReadonly,
    CsFormSelect,
    CsSwitch,
    CsFormTextarea,
    CsFormTextareaReadonly,
    SearchIcon,
  },
  data() {
    return {
      amountValue: new Amount(123000n, 8),
      decimals: 8,
      price: 25678,
      amount: 1230n,
      factors: [{
        name: 'BTC',
        decimals: 8,
      }, {
        name: 'mBTC',
        decimals: 5,
      }, {
        name: 'μBTC',
        decimals: 2,
      }],
      switchValue: true,
      inputValue: '',
      selectValue: undefined,
      options: [{
        name: 'USA',
        value: 'us',
      }, {
        name: 'Russia',
        value: 'ru',
      }, {
        name: 'Pakistan',
        value: 'pk',
      }],
      number: 21000n,
    };
  },
};
</script>

<template>
  <div class="&">
    <div class="&__group">
      <div>Cs Input</div>

      <CsFormInput
        v-model="inputValue"
        placeholder="Placeholder"
      />

      <CsFormInput
        v-model="inputValue"
        label="Label"
        placeholder="Placeholder"
      />

      <CsFormInput
        v-model="inputValue"
        label="Error state"
        placeholder="Invalid value"
        error="Error message"
      />

      <CsFormInputReadonly
        label="Readonly"
        value="value"
      />

      <CsFormDropdown
        label="Dropdown"
        value="dropdown"
      />

      <CsFormInput
        v-model="inputValue"
        label="Clear X"
        clear
      />

      <CsFormInput
        label="Info button"
        info="note"
      />

      <CsFormInputReadonly
        label="Info button (readonly)"
        value="some long text here, some long text here, some long text here"
        info="note"
      />

      <CsFormInput
        placeholder="Icons"
      >
        <template #before>
          <SearchIcon />
        </template>
        <template #after>
          <SearchIcon />
        </template>
      </CsFormInput>

      <CsFormInput
        small
        placeholder="Small"
      >
        <template #before>
          <SearchIcon />
        </template>
      </CsFormInput>
    </div>

    <div class="&__group">
      <div>Cs Textarea</div>
      <CsFormTextarea />

      <CsFormTextarea label="Textarea" />

      <CsFormTextarea
        label="Error state"
        error="Error message"
      />

      <CsFormTextareaReadonly
        label="Readonly"
        value="some text here readonly"
      />
    </div>


    <div class="&__group">
      <div>
        <div>Base Amount Input</div>
        <div>Amount Value "{{ amountValue }}" {{ typeof amountValue }}</div>
        <div>Decimals = {{ decimals }}</div>
      </div>
      <CsAmountInput
        v-model="amountValue"
        :decimals="decimals"
      />
    </div>

    <div class="&__group">
      <div>
        <div>Cs Amount Input</div>
        <div>Amount Value "{{ amountValue }}" {{ typeof amountValue }}</div>
        <div>Decimals = {{ decimals }}</div>
      </div>
      <CsFormAmountInput
        v-model="amountValue"
        label="Amount"
        :decimals="decimals"
        symbol="BTC"
        :price="price"
        currency="USD"
      />
      <CsFormAmountInput
        v-model="amountValue"
        label="Amount without select"
        :decimals="decimals"
        symbol="BTC"
      />
    </div>


    <div class="&__group">
      <div>Switch Value: "{{ switchValue }}" {{ typeof switchValue }}</div>
      <CsSwitch v-model="switchValue" />
    </div>

    <div class="&__group">
      <div>Select Value: "{{ selectValue }}"</div>
      <CsFormSelect
        v-model="selectValue"
        label="Select"
        :options="options"
      />
    </div>

    <div class="&__group">
      <div>
        Gas limit: {{ number }}
      </div>
      <CsFormBigIntInput
        v-model="number"
        label="Gas limit"
        info="Gas limit"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: $spacing-4xl;

    &__group {
      display: flex;
      flex-direction: column;
      gap: $spacing-xl;
    }
  }
</style>
