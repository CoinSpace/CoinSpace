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
  emits: ['back', 'next', 'replace', 'updateStorage'],
  methods: {
    back(args) {
      this.$emit('back', args);
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
