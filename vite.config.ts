import {resolve} from 'path';
import {PluginOption, defineConfig} from 'vite';
import {readFile} from 'node:fs/promises';
import typescript from 'rollup-plugin-typescript2';

const pkg = JSON.parse(await readFile('./package.json', 'utf-8'));

// NOTE: 'isolatedModules' must be enabled in tsconfig.json,
// see https://github.com/vitejs/vite/discussions/16680.
export default defineConfig({
  plugins: [{...typescript(), enforce: 'pre'} as PluginOption],
  build: {
    outDir: 'build',
    target: 'esnext',
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'api-client',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled.
      external: Object.keys(pkg.dependencies),
    },
  },
});
