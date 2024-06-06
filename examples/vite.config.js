import {svelte} from '@sveltejs/vite-plugin-svelte';
import vue from '@vitejs/plugin-vue';

export default {
  root: 'examples',
  resolve: {
    alias: {
      '@carto/core': '../packages/core/',
      '@carto/ui': '../packages/ui/',
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {isCustomElement: (tag) => tag.includes('-')},
      },
    }),
    svelte(),
  ],
};
