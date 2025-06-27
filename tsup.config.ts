import {defineConfig, Options} from 'tsup';

const commonConfig: Options = {
  outDir: 'build',
  target: 'es2020',
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
};

// Web Workers rely on ES Modules, and are not supported in our CJS builds.
export default defineConfig([
  {
    ...commonConfig,
    format: 'esm',
    entry: {
      'api-client': 'src/index.ts',
      worker: 'src/workers/widget-tileset-worker.ts',
    },
  },
  {
    ...commonConfig,
    format: 'cjs',
    entry: {'api-client': 'src/index.ts'},
    shims: true, // replace 'import.meta' references
  },
  {
    ...commonConfig,
    format: 'iife',
    outExtension() {
      return {
        js: `.js`,
      };
    },
    esbuildOptions(options) {
      options.logOverride ||= {};
      // "import.meta" is not available with "iife" output, but we don't
      // need the Worker URL inside the worker itself anyway.
      options.logOverride['empty-import-meta'] = 'silent';
    },
    entry: {
      'worker-compat': 'src/workers/widget-tileset-worker.ts',
    },
  },
]);
