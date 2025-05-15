import {
  getClient,
  setClient,
  clearDefaultRequestCache,
} from '@carto/api-client';
import {afterEach, vi} from 'vitest';

// NOTE: By default Vitest runs each test file in isolation, but sometimes we
// need to disable parallelism or isolation for debugging purposes. To confirm
// that all tests pass without parallism or isolation, use:
//
// yarn test --no-file-parallelism --no-isolate

const DEFAULT_CLIENT_ID = getClient();

afterEach(() => {
  setClient(DEFAULT_CLIENT_ID);
  clearDefaultRequestCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
