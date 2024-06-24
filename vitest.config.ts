import {defineConfig} from 'vitest/config';

// Tests run on the 'build' output and remap to 'src' with source maps, so we iclude both paths in
// coverage. Istanbul's `config.excludeAfterRemap` option is not exposed by Vitest, so bundled
// dependencies may be shown in the coverage report. Ignore those for now, as we expect bundling
// these dependencies to be temporary. See: https://github.com/vitest-dev/vitest/discussions/5964.
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*', 'build/**/*'],
    },
  },
});
