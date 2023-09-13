<script>
import SmartLayout from '../../layouts/SmartLayout.vue';

export default {
  components: {
    SmartLayout,
  },
  data() {
    return {
      page: 0,
      items: [],
      isLoading: false,
      isRefreshing: false,
    };
  },
  methods: {
    async loadMore() {
      this.isLoading = true;
      return new Promise((resolve) => {
        setTimeout(() => {
          const more = [];
          for (let i = 10 * this.page; i < 10 * (this.page + 1); i++) {
            more.push(i);
          }
          this.items = [
            ...this.items,
            ...more,
          ];
          this.page++;
          this.isLoading = false;
          resolve();
        }, 500);
      });
    },
    async refresh() {
      this.isRefreshing = true;
      await this.loadMore();
      this.isRefreshing = false;
    },
  },
};
</script>

<template>
  <SmartLayout
    class="&"
    :isLoading="isLoading"
    :isRefreshing="isRefreshing"
    :isLoadedAll="false"
    @loadMore="loadMore"
    @refresh="refresh"
  >
    <ul>
      <li
        v-for="item in items"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
  </SmartLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    width: 100%;
    height: 500px;
    background-color: antiquewhite;
  }
</style>
