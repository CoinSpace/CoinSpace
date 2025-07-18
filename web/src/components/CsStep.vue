<script>
export default {
  props: {
    storage: {
      type: Object,
      required: true,
    },
    args: {
      type: Object,
      default: undefined,
    },
  },
  emits: ['back', 'backTo', 'next', 'replace', 'updateStorage'],
  methods: {
    back(args) {
      this.$emit('back', args);
    },
    backTo(step, args) {
      this.$emit('backTo', step, args);
    },
    next(step, args) {
      this.$emit('next', step, args);
    },
    replace(step, args) {
      this.$emit('replace', step, args);
    },
    updateStorage(update) {
      this.$emit('updateStorage', update);
    },
  },
};
</script>
