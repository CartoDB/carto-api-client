import {svelte} from '@sveltejs/vite-plugin-svelte';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  root: 'examples',
  resolve: {
    alias: {
      '@carto/api-client': resolve(__dirname, '../'),
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
