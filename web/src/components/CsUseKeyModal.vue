<script>
//import CsButton from '../components/CsButton.vue';
//import CsButtonGroup from '../components/CsButtonGroup.vue';
import CsModal from '../components/CsModal.vue';

export default {
  components: {
    //CsButton,
    //CsButtonGroup,
    CsModal,
  },
  props: {
    show: Boolean,
  },
  emits: ['close'],
};
</script>

<template>
  <CsModal
    :show="show"
    :title="$t('Hardware key')"
    @close="$emit('close')"
  >
    {{ $t('Use your hardware key.') }}
    <!--template #footer>
      <CsButtonGroup>
        <CsButton
          type="primary-link"
          @close="$emit('close')"
        >
          {{ $t('Cancel') }}
        </CsButton>
      </CsButtonGroup>
    </template-->
  </CsModal>
</template>
