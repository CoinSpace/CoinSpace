/* eslint-env node */
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import svgLoader from 'vite-svg-loader';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './');
  return {
    server: {
      open: true,
      strictPort: true,
      proxy: {
        '/api': { target: 'http://localhost:8080' },
        '/assets/crypto': { target: 'http://localhost:8080' },
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
      ViteEjsPlugin(() => ({ env })),
      ViteMinifyPlugin(),
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          filesToDeleteAfterUpload: outDir(env.VITE_BUILD_TYPE) + '/**/*.map',
        },
        disable: !process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
    build: {
      minify: false,
      outDir: outDir(env.VITE_BUILD_TYPE),
      emptyOutDir: true,
      sourcemap: 'hidden',
      rollupOptions: {
        input: inputs(env.VITE_BUILD_TYPE),
        preserveEntrySignatures: env.VITE_BUILD_TYPE === 'electron' ? 'exports-only' : undefined,
        output: {
          entryFileNames(info) {
            if (info.name === 'variables') {
              return 'variables.js';
            }
            return 'assets/js/[name]-[hash].js';
          },
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
            if (/\.svg$/.test(name)) dir = 'img/';
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
  };
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

function outDir(buildType) {
  switch (buildType) {
    case 'electron':
      return '../electron/dist';
    case 'phonegap':
      return '../phonegap/build/www';
    default:
      return '../server/dist';
  }
}

function inputs(buildType) {
  const inputs = {
    main: './index.html',
  };
  if (buildType === 'web') {
    inputs['fido'] = './fido/index.html';
  }
  if (buildType === 'electron') {
    inputs['variables'] = './src/variables.js';
  }
  return inputs;
}
