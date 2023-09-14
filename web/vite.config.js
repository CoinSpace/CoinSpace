/* eslint-env node */
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { defineConfig } from 'vite';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import svgLoader from 'vite-svg-loader';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import vue from '@vitejs/plugin-vue';

import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    open: true,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080' },
    },
  },
  base: process.env.BASE_URL || '/',
  plugins: [
    nodePolyfills(),
    vue({
      template: {
        compilerOptions: {
          nodeTransforms: [bem],
        },
      },
    }),
    svgLoader({ svgo: false }),
    sfcAutoName(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@coinspace/crypto-db/logo/*',
          dest: 'assets/crypto/',
        },
      ],
    }),
    ViteMinifyPlugin(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        fido: path.resolve(__dirname, 'fido/index.html'),
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames(info) {
          const defaultName = 'assets/js/[name]-[hash].js';
          if (/src\/lib\/i18n\/messages\/[a-z-]+\.json/.test(info.facadeModuleId)) {
            const match = /messages\/([a-z-]+).json/.exec(info.facadeModuleId);
            return `assets/js/i18n/${match[1]}-[hash].js`;
          }
          if (info.name === 'index') {
            const id = info.facadeModuleId || info.moduleIds[0];
            const match = /node_modules\/((@[^/]*\/)?[^/]*)\//.exec(id);
            if (!match) return defaultName;
            return `assets/js/${match[1]}-[hash].js`;
          }
          return defaultName;
        },
        assetFileNames({ name }) {
          let dir = '';
          if (/\.css$/.test(name)) dir = 'css/';
          if (/\.wasm$/.test(name)) dir = 'wasm/';
          return `assets/${dir}[name]-[hash][extname]`;
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (content, filename) => {
          const kebab = kebabanize(filename);
          const str = `
            @import "./src/assets/styles/variables";
            @import "./src/assets/styles/mixins";
            @import "./src/assets/styles/functions";
            $filename: "${kebab}";
          `;
          return str + content;
        },
      },
    },
  },
});

function kebabanize(componentPath) {
  return path.basename(componentPath, '.vue').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function bem(node, context) {
  if (!node.props) return;
  const kebab = kebabanize(context.selfName);
  node.props.forEach((prop) => {
    if (prop.name === 'class') {
      prop.value.content = prop.value.content.replace(/&/g, kebab);
    }
    if (prop.name === 'bind' && prop.arg?.content === 'class') {
      if (prop.exp.children) {
        prop.exp.children = prop.exp.children.map((child) => {
          if (typeof child === 'string') {
            child = child.replace(/&([-_])/g, `${kebab}$1`);
          }
          return child;
        });
      }
      if (prop.exp.content) {
        prop.exp.content = prop.exp.content.replace(/&/g, kebab);
      }
    }
  });
}

function sfcAutoName() {
  return {
    name: 'sfc-auto-name',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.vue$/.test(id)) return;
      const name = path.basename(id, '.vue');
      return {
        code: code.replace(/(export default \{)/, `$1 name: '${name}',`),
        map: null,
      };
    },
  };
}
