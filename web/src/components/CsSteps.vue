<script>
export default {
  props: {
    steps: {
      type: Object,
      required: true,
    },
    step: {
      type: String,
      default: 'index',
    },
  },
  data() {
    return {
      currentStep: this.step,
      exclude: undefined,
      storage: {},
      prevSteps: new Map(),
      args: {},
      transition: 'slide-left',
    };
  },
  methods: {
    back(args) {
      const { currentStep } = this;
      this.exclude = this.steps[currentStep].name;
      const prevStep = this.prevSteps.get(currentStep);
      if (!prevStep) {
        return this.$router.up();
      }
      this.currentStep = prevStep;
      this.args = args;
      this.prevSteps.delete(currentStep);
      this.transition = 'slide-right';
    },
    next(value, args) {
      if (this.currentStep === value) return;
      const [currentStep, exclude] = this.slicePinStep();
      this.prevSteps.set(value, currentStep);
      this.currentStep = value;
      this.exclude = exclude;
      this.args = args;
      this.transition = 'slide-left';
    },
    replace(value, args) {
      if (this.currentStep === value) return;
      const [currentStep, exclude] = this.slicePinStep();
      const prevStep = this.prevSteps.get(currentStep);
      if (prevStep) {
        this.prevSteps.delete(currentStep);
        this.prevSteps.set(value, prevStep);
      }
      this.currentStep = value;
      this.exclude = exclude;
      this.args = args;
      this.transition = 'slide-left';
    },
    slicePinStep() {
      if (this.currentStep === 'pin') {
        const prevStep = this.prevSteps.get(this.currentStep);
        this.prevSteps.delete(this.currentStep);
        return [prevStep, this.steps[this.currentStep].name];
      }
      return [this.currentStep];
    },
    updateStorage(update) {
      this.storage = { ...this.storage, ...update };
    },
  },
};
</script>

<template>
  <div class="&">
    <Transition :name="transition">
      <KeepAlive :exclude="exclude">
        <component
          :is="steps[currentStep]"
          :storage="storage"
          :args="args"
          @back="back"
          @next="next"
          @replace="replace"
          @updateStorage="updateStorage"
        />
      </KeepAlive>
    </Transition>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    height: 100%;
  }
</style>
