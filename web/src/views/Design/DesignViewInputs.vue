<script>
import { Amount } from '@coinspace/cs-common';

import CsAmountInput from '../../components/CsAmountInput.vue';
import CsFormAmountInput from '../../components/CsForm/CsFormAmountInput.vue';
import CsFormBigIntInput from '../../components/CsForm/CsFormBigIntInput.vue';
import CsFormDatepicker from '../../components/CsForm/CsFormDatepicker.vue';
import CsFormDropdown from '../../components/CsForm/CsFormDropdown.vue';
import CsFormFilepicker from '../../components/CsForm/CsFormFilepicker.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsFormSelect from '../../components/CsForm/CsFormSelect.vue';
import CsFormTextarea from '../../components/CsForm/CsFormTextarea.vue';
import CsFormTextareaReadonly from '../../components/CsForm/CsFormTextareaReadonly.vue';
import CsSwitch from '../../components/CsSwitch.vue';

import EditIcon from '../../assets/svg/edit.svg';
import SearchIcon from '../../assets/svg/search.svg';
import WalletSmallIcon from '../../assets/svg/walletSmall.svg';

import { dataUrlSize } from '../../lib/helpers.js';

export default {
  components: {
    CsAmountInput,
    CsFormAmountInput,
    CsFormBigIntInput,
    CsFormDatepicker,
    CsFormFilepicker,
    CsFormDropdown,
    CsFormInput,
    CsFormSelect,
    CsSwitch,
    CsFormTextarea,
    CsFormTextareaReadonly,
    EditIcon,
    SearchIcon,
    WalletSmallIcon,
  },
  data() {
    return {
      amountValue: new Amount(123000n, 8),
      secondAmountValue: undefined,
      crypto: {
        symbol: 'BTC',
        decimals: 8,
        price: 100000,
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
      },
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
      datepickerValue: undefined,
      filepickerValue: undefined,
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
  methods: {
    setAmount(amount, decimals) {
      this.secondAmountValue = amount === undefined ? undefined : new Amount(amount, decimals);
    },
    dataUrlSize,
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
        inputmode="numeric"
        placeholder="input mode = numeric"
      />

      <CsFormInput
        v-model="inputValue"
        inputmode="email"
        placeholder="input mode = email"
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
        value="some text here readonly some text here readonly"
        info="note"
      />
      <CsFormTextareaReadonly
        label="Readonly + copy"
        value="some text here readonly some text here readonly"
        copy
        info="note"
      />
      <CsFormTextareaReadonly
        label="Readonly + icon"
        value="Your wallet"
        info="note"
      >
        <template #before>
          <WalletSmallIcon />
        </template>
        <template #after>
          <EditIcon />
        </template>
      </CsFormTextareaReadonly>
      <CsFormTextareaReadonly
        label="Readonly (inheritDir)"
        value="some text here readonly some text here readonly"
        info="note"
        inheritDir
      />
      <CsFormTextareaReadonly
        label="Readonly + icon (inheritDir)"
        value="You wallet"
        info="note"
        inheritDir
      >
        <template #before>
          <WalletSmallIcon />
        </template>
        <template #after>
          <EditIcon />
        </template>
      </CsFormTextareaReadonly>
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
      <CsFormAmountInput
        v-model="secondAmountValue"
        label="Amount (set amount / crypto)"
        :decimals="crypto.decimals"
        :symbol="crypto.symbol"
        :price="crypto.price"
        :factors="crypto.factors ? crypto.factors : []"
        currency="USD"
      />
      <a @click="setAmount(1005000n, crypto.decimals)">Set amount (100500)</a>
      <a @click="setAmount(0n, crypto.decimals)">Set amount (0)</a>
      <a @click="setAmount(undefined, crypto.decimals)">Set amount (undefined)</a>
      <a @click="crypto = { symbol: 'XMR', decimals: 12, price: 2000 }">Set crypto (XMR)</a>
      <a
        @click="crypto = {
          symbol: 'BTC',
          decimals: 8,
          price: 100000,
          factors: [{
            name: 'BTC',
            decimals: 8,
          }, {
            name: 'mBTC',
            decimals: 5,
          }, {
            name: 'μBTC',
            decimals: 2,
          }]}"
      >Set crypto (BTC)</a>
    </div>

    <div class="&__group">
      <div>Switch Value: "{{ switchValue }}" {{ typeof switchValue }}</div>
      <CsSwitch
        :checked="switchValue"
        @click="switchValue = !switchValue"
      />
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
      <div>Datepicker Value: "{{ datepickerValue }}"</div>
      <CsFormDatepicker
        v-model="datepickerValue"
        label="Date of birth"
      />
    </div>

    <div class="&__group">
      <div>
        Filepicker Value: "
        {{ filepickerValue?.dataUrl?.substring(0, 32) }},
        {{ dataUrlSize(filepickerValue?.dataUrl) }} bytes"
      </div>
      <CsFormFilepicker
        v-model="filepickerValue"
        label="Document"
        placeholder="Select file..."
        capture
        :clear="true"
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
    gap: var(--spacing-4xl);

    &__group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    &__btn {
      max-width: 20rem;
    }
  }
</style>
