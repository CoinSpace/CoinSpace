<script>
import CsPinStep from '../../components/CsPinStep.vue';
import CsSteps from '../../components/CsSteps.vue';

import CardsStepBuy from './CardsStepBuy.vue';
import CardsStepCard from './CardsStepCard.vue';
import CardsStepChooseCountry from './CardsStepChooseCountry.vue';
import CardsStepConfirm from './CardsStepConfirm.vue';
import CardsStepDetails from './CardsStepDetails.vue';
import CardsStepFilterBlockchain from './CardsStepFilterBlockchain.vue';
import CardsStepHistory from './CardsStepHistory.vue';
import CardsStepKycAdditional from './CardsStepKycAdditional.vue';
import CardsStepKycAddress from './CardsStepKycAddress.vue';
import CardsStepKycContact from './CardsStepKycContact.vue';
import CardsStepKycDocument from './CardsStepKycDocument.vue';
import CardsStepKycPersonal from './CardsStepKycPersonal.vue';
import CardsStepList from './CardsStepList.vue';
import CardsStepRemove from './CardsStepRemove.vue';
import CardsStepSeed from './CardsStepSeed.vue';
import CardsStepShowcase from './CardsStepShowcase.vue';
import CardsStepSource from './CardsStepSource.vue';
import CardsStepStatus from './CardsStepStatus.vue';
import CardsStepTopup from './CardsStepTopup.vue';
import CardsStepTransaction from './CardsStepTransaction.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CardsStepSeed,
    list: CardsStepList,

    card: CardsStepCard,
    history: CardsStepHistory,
    transaction: CardsStepTransaction,
    details: CardsStepDetails,
    remove: CardsStepRemove,
    topup: CardsStepTopup,
    source: CardsStepSource,
    filterBlockchain: CardsStepFilterBlockchain,

    chooseCountry: CardsStepChooseCountry,
    showcase: CardsStepShowcase,
    buy: CardsStepBuy,

    confirm: CardsStepConfirm,
    status: CardsStepStatus,

    kycPersonal: CardsStepKycPersonal,
    kycContact: CardsStepKycContact,
    kycAddress: CardsStepKycAddress,
    kycDocument: CardsStepKycDocument,
    kycAdditional: CardsStepKycAdditional,

    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
