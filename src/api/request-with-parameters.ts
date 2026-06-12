// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isPureObject} from '../utils.js';
import {CartoAPIError, type APIErrorContext} from './carto-api-error.js';
import {V3_MINOR_VERSION} from '../constants-internal.js';
import {DEFAULT_MAX_LENGTH_URL} from '../constants-internal.js';
import {getClient} from '../client.js';
import type {LocalCacheOptions} from '../sources/types.js';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const DEFAULT_REQUEST_CACHE = new Map<string, Promise<unknown>>();

export async function requestWithParameters<T = any>({
  baseUrl,
  parameters = {},
  headers: customHeaders = {},
  errorContext,
  maxLengthURL = DEFAULT_MAX_LENGTH_URL,
  localCache,
  signal,
  credentials,
}: {
  baseUrl: string;
  parameters?: Record<string, unknown>;
  headers?: Record<string, string>;
  errorContext: APIErrorContext;
  maxLengthURL?: number;
  localCache?: LocalCacheOptions;
  signal?: AbortSignal;
  /** Forwarded to `fetch()`. Session auth mode passes 'same-origin'. */
  credentials?: RequestCredentials;
}): Promise<T> {
  // Parameters added to all requests issued with `requestWithParameters()`.
  // These parameters override parameters already in the base URL, but not
  // user-provided parameters.
  parameters = {
    v: V3_MINOR_VERSION,
    client: getClient(),
    ...(typeof deck !== 'undefined' &&
      deck.VERSION && {deckglVersion: deck.VERSION}),
    ...parameters,
  };

  baseUrl = excludeURLParameters(baseUrl, Object.keys(parameters));
  const key = createCacheKey(baseUrl, parameters, customHeaders);

  const {
    cache: REQUEST_CACHE,
    canReadCache,
    canStoreInCache,
  } = getCacheSettings(localCache);

  if (canReadCache && REQUEST_CACHE.has(key)) {
    return REQUEST_CACHE.get(key) as Promise<T>;
  }

  const url = createURLWithParameters(baseUrl, parameters);
  const headers = {...DEFAULT_HEADERS, ...customHeaders};

  /* global fetch */
  const fetchPromise =
    url.length > maxLengthURL
      ? fetch(baseUrl, {
          method: 'POST',
          body: JSON.stringify(parameters),
          headers,
          signal,
          ...(credentials && {credentials}),
        })
      : fetch(url, {headers, signal, ...(credentials && {credentials})});

  let response: Response | undefined;
  let responseJson: unknown;
  const jsonPromise: Promise<T> = fetchPromise
    .then((_response: Response) => {
      response = _response;
      return response.json();
    })
    .then((json: any) => {
      responseJson = json;
      if (!response || !response.ok) {
        throw new Error(json.error);
      }
      return json;
    })
    .catch((error: Error) => {
      if (canStoreInCache) {
        REQUEST_CACHE.delete(key);
      }
      throw new CartoAPIError(error, errorContext, response, responseJson);
    });

  if (canStoreInCache) {
    REQUEST_CACHE.set(key, jsonPromise);
  }
  return jsonPromise;
}

function getCacheSettings(localCache: LocalCacheOptions | undefined) {
  const canReadCache = localCache?.cacheControl?.includes('no-cache')
    ? false
    : true;
  const canStoreInCache = localCache?.cacheControl?.includes('no-store')
    ? false
    : true;
  const cache = localCache?.cache || DEFAULT_REQUEST_CACHE;

  return {
    cache,
    canReadCache,
    canStoreInCache,
  };
}

function createCacheKey(
  baseUrl: string,
  parameters: Record<string, unknown>,
  headers: Record<string, string>
): string {
  const parameterEntries = Object.entries(parameters).sort(([a], [b]) =>
    a > b ? 1 : -1
  );
  const headerEntries = Object.entries(headers).sort(([a], [b]) =>
    a > b ? 1 : -1
  );
  return JSON.stringify({
    baseUrl,
    parameters: parameterEntries,
    headers: headerEntries,
  });
}

/**
 * Base URLs may be relative (e.g. a same-origin proxy like
 * '/app/_proxy/<slug>/v3/...' used with session auth mode). `new URL()`
 * requires an origin, so relative URLs are resolved against a marker origin
 * that is stripped back off before returning.
 */
const RELATIVE_ORIGIN = 'https://relative.invalid';

function parseBaseUrl(baseUrlString: string): {url: URL; isRelative: boolean} {
  // Protocol-relative URLs ('//host/...') carry a host and must not be treated
  // as relative, or the host would be lost when resolved against RELATIVE_ORIGIN.
  const isRelative =
    baseUrlString.startsWith('/') && !baseUrlString.startsWith('//');
  return {
    url: new URL(baseUrlString, isRelative ? RELATIVE_ORIGIN : undefined),
    isRelative,
  };
}

function serializeBaseUrl(url: URL, isRelative: boolean): string {
  return isRelative ? `${url.pathname}${url.search}` : url.toString();
}

/**
 * Appends query string parameters to a URL. Existing URL parameters are kept,
 * unless there is a conflict, in which case the new parameters override
 * those already in the URL.
 */
function createURLWithParameters(
  baseUrlString: string,
  parameters: Record<string, unknown>
): string {
  const {url: baseUrl, isRelative} = parseBaseUrl(baseUrlString);
  for (const [key, value] of Object.entries(parameters)) {
    if (isPureObject(value) || Array.isArray(value)) {
      baseUrl.searchParams.set(key, JSON.stringify(value));
    } else {
      if (value !== null && value !== undefined) {
        baseUrl.searchParams.set(
          key,
          (value as string | boolean | number).toString()
        );
      }
    }
  }
  return serializeBaseUrl(baseUrl, isRelative);
}

/**
 * Deletes query string parameters from a URL.
 */
function excludeURLParameters(baseUrlString: string, parameters: string[]) {
  const {url: baseUrl, isRelative} = parseBaseUrl(baseUrlString);
  for (const param of parameters) {
    if (baseUrl.searchParams.has(param)) {
      baseUrl.searchParams.delete(param);
    }
  }
  return serializeBaseUrl(baseUrl, isRelative);
}

/**
 * Clears the HTTP response cache for all requests using the default cache.
 * @internal
 */
export function clearDefaultRequestCache() {
  DEFAULT_REQUEST_CACHE.clear();
}
