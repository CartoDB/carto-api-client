import {svelte} from '@sveltejs/vite-plugin-svelte';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  root: 'examples',
  resolve: {
    alias: {
      '@carto/core': resolve(__dirname, '../packages/core/'),
      '@carto/ui': resolve(__dirname, '../packages/ui/'),
      '@carto/ui/react': resolve(__dirname, '../packages/ui/'),
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
