<script>
import CsButton from '../../components/CsButton.vue';
import CsListItem from '../../components/CsListItem.vue';
import CsListItemDropdown from '../../components/CsListItemDropdown.vue';
import CsListItems from '../../components/CsListItems.vue';
import CsSwitch from '../../components/CsSwitch.vue';

import DeleteIcon from '../../assets/svg/delete.svg';
import ImportIcon from '../../assets/svg/import.svg';

export default {
  components: {
    CsButton,
    CsListItem,
    CsListItemDropdown,
    CsListItems,
    DeleteIcon,
    ImportIcon,
    CsSwitch,
  },
  data() {
    return {
      dropdownOptions: [
        { name: 'RUB', value: 'RUB' },
        { name: 'EUR', value: 'EUR' },
        { name: 'USD', value: 'USD' },
      ],
      dropdownValue: 'USD',
      switchValue: true,
    };
  },
};
</script>

<template>
  <div class="&">
    <CsListItems>
      <CsListItem title="Item #1" />
      <CsListItem title="Item #2" />
    </CsListItems>

    <CsListItems>
      <CsListItem
        title="Logout"
        type="danger"
        :arrow="false"
      />
    </CsListItems>

    <CsListItems title="With title">
      <CsListItem title="Item #1" />
      <CsListItem title="Item #2" />
    </CsListItems>

    <CsListItems title="With Description">
      <CsListItem
        title="Item #1"
        description="Description #1"
      />
      <CsListItem
        title="Item #2"
        description="Description #Long. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Alias at libero?"
      />
    </CsListItems>

    <CsListItems title="Icon after">
      <CsListItem title="Item #1">
        <template #after>
          <CsButton>
            <DeleteIcon />
          </CsButton>
        </template>
      </CsListItem>
    </CsListItems>

    <CsListItems title="Icon before">
      <CsListItem title="Item #1">
        <template #before>
          <ImportIcon />
        </template>
      </CsListItem>
    </CsListItems>

    <CsListItems title="With dropdown">
      <CsListItem title="Local currency">
        <template #after>
          <CsListItemDropdown
            v-model="dropdownValue"
            :options="dropdownOptions"
          />
        </template>
      </CsListItem>
    </CsListItems>

    <CsListItems title="With switch">
      <CsListItem
        title="High Security"
        description="Send coins, export private keys, remove account, change securuty settings"
      >
        <template #after>
          <CsSwitch v-model="switchValue" />
        </template>
      </CsListItem>
    </CsListItems>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3.5rem;

    .cs-list-items {
      width: 100%;
      max-width: 35rem;
    }
  }
</style>
