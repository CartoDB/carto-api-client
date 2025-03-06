import {describe, test, expect, vi, beforeEach, assert} from 'vitest';
import {
  APIRequestType,
  CartoAPIError,
  requestWithParameters,
} from '@carto/api-client';

const errorContext = {requestType: 'test' as APIRequestType};

describe('requestWithParameters', () => {
  beforeEach(() => {
    const mockFetch = vi
      .fn()
      .mockReturnValue(
        Promise.resolve({ok: true, json: () => Promise.resolve({data: 12345})})
      );

    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('deck', {VERSION: 'untranspiled source'});
  });

  test('cache baseURL', async () => {
    const mockFetch = vi.mocked(fetch);

    expect(mockFetch).not.toHaveBeenCalled();

    await Promise.all([
      requestWithParameters({
        baseUrl: 'https://example.com/v1/baseURL',
        headers: {},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v2/baseURL',
        headers: {},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v2/baseURL',
        headers: {},
        errorContext,
      }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('cache headers', async () => {
    const mockFetch = vi.mocked(fetch);

    expect(mockFetch).not.toHaveBeenCalled();

    await Promise.all([
      requestWithParameters({
        baseUrl: 'https://example.com/v1/headers',
        headers: {key: '1'},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v1/headers',
        headers: {key: '1'},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v1/headers',
        headers: {key: '2'},
        errorContext,
      }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('cache parameters', async () => {
    const mockFetch = vi.mocked(fetch);

    expect(mockFetch).not.toHaveBeenCalled();

    await Promise.all([
      requestWithParameters({
        baseUrl: 'https://example.com/v1/params',
        headers: {},
        parameters: {},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v1/params',
        headers: {},
        parameters: {},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v1/params',
        headers: {},
        parameters: {a: 1},
        errorContext,
      }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('no cache error context', async () => {
    const mockFetch = vi
      .mocked(fetch)
      .mockReset()
      .mockReturnValue(
        // @ts-ignore
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({error: 'CustomError', customData: {abc: 'def'}}),
        })
      );

    expect(mockFetch).not.toHaveBeenCalled();

    let error1: Error | undefined;
    let error2: Error | undefined;

    try {
      await requestWithParameters({
        baseUrl: 'https://example.com/v1/errorContext',
        errorContext: {requestType: 'Map data'},
      });
      assert.fail('request #1 should fail, but did not');
    } catch (error) {
      error1 = error as Error;
    }

    try {
      await requestWithParameters({
        baseUrl: 'https://example.com/v1/errorContext',
        errorContext: {requestType: 'SQL'},
      });
      assert.fail('request #2 should fail, but did not');
    } catch (error) {
      error2 = error as Error;
    }

    // 2 unique requests, failures not cached
    expect(mockFetch).toHaveBeenCalledTimes(2);

    expect((error1 as CartoAPIError).responseJson).toMatchObject({
      error: 'CustomError',
      customData: {abc: 'def'},
    });

    expect(error1 instanceof CartoAPIError).toBeTruthy();
    expect((error1 as CartoAPIError).errorContext.requestType).toBe('Map data');
    expect(error2 instanceof CartoAPIError).toBeTruthy();
    expect((error2 as CartoAPIError).errorContext.requestType).toBe('SQL');
  });

  test('method GET or POST', async () => {
    const mockFetch = vi.mocked(fetch);

    expect(mockFetch).not.toHaveBeenCalled();

    await Promise.all([
      requestWithParameters({
        baseUrl: 'https://example.com/v1/params',
        headers: {},
        parameters: {object: {a: 1, b: 2}, array: [1, 2, 3], string: 'short'},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: `https://example.com/v1/params`,
        headers: {},
        parameters: {
          object: {a: 1, b: 2},
          array: [1, 2, 3],
          string: 'long'.padEnd(10_000, 'g'),
        },
        errorContext,
      }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);

    const calls = mockFetch.mock.calls;

    // GET
    expect(calls[0][0]).toMatch(/^https:\/\/example\.com\/v1\/params\?/);
    expect(calls[0][1].method).toBe(undefined);
    expect(calls[0][1].body).toBe(undefined);
    expect(
      Array.from(new URL(calls[0][0] as string).searchParams.entries())
    ).toEqual([
      ['v', '3.4'],
      ['client', 'deck-gl-carto'],
      ['deckglVersion', 'untranspiled source'],
      ['object', '{"a":1,"b":2}'],
      ['array', '[1,2,3]'],
      ['string', 'short'],
    ]);

    // POST
    const postBody = JSON.parse(calls[1][1].body as string);
    expect(calls[1][1].method).toBe('POST');
    expect(postBody.v).toBe('3.4');
    expect(postBody.deckglVersion).toBe('untranspiled source');
    expect(postBody.object).toEqual({a: 1, b: 2});
    expect(postBody.array).toEqual([1, 2, 3]);
    expect(postBody.string).toMatch(/^longgg/);
    expect(calls[1][0]).toBe('https://example.com/v1/params');
  });

  test('parameter precedence', async () => {
    const mockFetch = vi.mocked(fetch);

    expect(mockFetch).not.toHaveBeenCalled();

    await Promise.all([
      requestWithParameters({
        baseUrl: 'https://example.com/v1/params?test=1',
        headers: {},
        parameters: {},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: `https://example.com/v1/params?test=2&v=3.0`,
        headers: {},
        parameters: {},
        errorContext,
      }),
      requestWithParameters({
        baseUrl: `https://example.com/v1/params?test=3&v=3.0`,
        headers: {},
        parameters: {v: '3.2'},
        errorContext,
      }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(3);

    const calls = mockFetch.mock.calls;
    const [url1, url2, url3] = calls.map((call) => new URL(call[0] as string));

    expect(url1.searchParams.get('v')).toBe('3.4'); // unset
    expect(url2.searchParams.get('v')).toBe('3.4'); // default overrides url
    expect(url3.searchParams.get('v')).toBe('3.2'); // param overrides default
  });

  test('maxLengthURL', async () => {
    const mockFetch = vi.mocked(fetch);

    expect(mockFetch).not.toHaveBeenCalled();

    await Promise.all([
      requestWithParameters({
        baseUrl: 'https://example.com/v1/item/1',
        errorContext,
      }),
      requestWithParameters({
        baseUrl: 'https://example.com/v1/item/2',
        maxLengthURL: 10,
        errorContext,
      }),
      requestWithParameters({
        baseUrl: `https://example.com/v1/item/3`,
        parameters: {content: 'long'.padEnd(10_000, 'g')}, // > default limit
        errorContext,
      }),
      requestWithParameters({
        baseUrl: `https://example.com/v1/item/4`,
        parameters: {content: 'long'.padEnd(10_000, 'g')},
        maxLengthURL: 15_000,
        errorContext,
      }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(4);

    const calls = mockFetch.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const methods = calls.map(([_, {method}]) => method ?? 'GET');

    expect(methods).toEqual(['GET', 'POST', 'POST', 'GET']);
  });
});
