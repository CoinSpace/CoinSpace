<script>

const iconModules = import.meta.glob('../../assets/svg/*.svg', {
  eager: true,
  import: 'default',
});

const icons = {};
for (const path in iconModules) {
  const name = path.split('/').pop().replace('.svg', '');
  icons[name] = iconModules[path];
}

export default {
  computed: {
    icons() {
      return icons;
    },
  },
};
</script>
<template>
  <div class="&">
    <component
      :is="icon"
      v-for="(icon, name) in icons"
      :key="name"
    />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);

    svg {
      width: var(--spacing-4xl);
    }
  }
</style>
