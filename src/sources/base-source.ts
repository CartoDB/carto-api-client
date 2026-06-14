// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DEFAULT_API_BASE_URL} from '../constants.js';
import {DEFAULT_MAX_LENGTH_URL} from '../constants-internal.js';
import {buildSourceUrl} from '../api/endpoints.js';
import {
  buildAuthHeaders,
  getAuthCredentials,
  rewriteUrlForSessionMode,
} from '../api/auth.js';
import {requestWithParameters} from '../api/request-with-parameters.js';
import type {
  SourceOptionalOptions,
  SourceRequiredOptions,
  TilejsonMapInstantiation,
  TilejsonResult,
} from './types.js';
import type {MapType} from '../types.js';
import type {APIErrorContext} from '../api/index.js';
import {getClient} from '../client.js';

export const SOURCE_DEFAULTS: Omit<SourceOptionalOptions, 'clientId'> = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  headers: {},
  maxLengthURL: DEFAULT_MAX_LENGTH_URL,
};

export async function baseSource<UrlParameters extends Record<string, unknown>>(
  endpoint: MapType,
  options: Partial<SourceOptionalOptions> & SourceRequiredOptions,
  urlParameters: UrlParameters
): Promise<TilejsonResult> {
  const {accessToken, connectionName, cache, ...optionalOptions} = options;
  const mergedOptions = {
    ...SOURCE_DEFAULTS,
    clientId: getClient(),
    accessToken,
    connectionName,
    endpoint,
  };
  for (const key in optionalOptions) {
    if (optionalOptions[key as keyof typeof optionalOptions]) {
      (mergedOptions as any)[key] =
        optionalOptions[key as keyof typeof optionalOptions];
    }
  }
  const baseUrl = buildSourceUrl(mergedOptions);
  const {clientId, maxLengthURL, localCache} = mergedOptions;
  const sessionMode = options.authMode === 'session';
  const headers = {
    ...buildAuthHeaders(options),
    ...options.headers,
  };
  const credentials = getAuthCredentials(options.authMode);
  // Opt into the server embedding the tilejson document in the instantiation
  // response (maps-api sc-556572) so the follow-up GET below can be skipped.
  // Safe against servers that don't support it: the unknown query param is
  // ignored and `tilejson.data` is simply absent, falling back to the fetch.
  const parameters = {
    client: clientId,
    inlineTilejson: true,
    ...options.tags,
    ...urlParameters,
  };

  const errorContext: APIErrorContext = {
    requestType: 'Map instantiation',
    connection: options.connectionName,
    type: endpoint,
    source: JSON.stringify(parameters, undefined, 2),
  };
  const {tilejson, schema} =
    await requestWithParameters<TilejsonMapInstantiation>({
      baseUrl,
      parameters,
      headers,
      errorContext,
      maxLengthURL,
      localCache,
      credentials,
    });

  let dataUrl = tilejson.url[0];
  if (cache) {
    cache.value = parseInt(
      new URL(dataUrl).searchParams.get('cache') || '',
      10
    );
  }
  if (sessionMode) {
    // The instantiation response points at the tenant API host, which the
    // browser cannot reach directly in session mode — route it through the
    // same-origin proxy behind apiBaseUrl.
    dataUrl = rewriteUrlForSessionMode(dataUrl, mergedOptions.apiBaseUrl);
  }
  // When the server inlined the tilejson document, use it directly and skip
  // the follow-up request — one round trip less per source. Otherwise fetch it
  // from the URL (older servers, or endpoints that don't inline).
  let json: TilejsonResult;
  if (tilejson.data) {
    // Shallow-copy before the sessionMode/accessToken/schema rewrites below:
    // tilejson.data is embedded in the (cacheable) instantiation response, so
    // mutating it in place would corrupt the cached object for later calls
    // (e.g. double-rewriting tile URLs in sessionMode). The downstream mutations
    // are all top-level property reassignments, so a shallow copy is enough.
    json = {...tilejson.data};
  } else {
    errorContext.requestType = 'Map data';
    json = await requestWithParameters<TilejsonResult>({
      baseUrl: dataUrl,
      parameters: {client: clientId},
      headers,
      errorContext,
      maxLengthURL,
      localCache,
      credentials,
    });
  }
  if (sessionMode) {
    // Tile URL templates also point at the tenant API host. Rewrite them onto
    // the proxy, and deliberately leave `json.accessToken` unset: consumers
    // (e.g. deck.gl tile layers) must not attach an Authorization header —
    // the session credential rides on the same-origin cookie instead.
    json.tiles = json.tiles?.map((template) =>
      rewriteUrlForSessionMode(template, mergedOptions.apiBaseUrl)
    );
  } else if (accessToken) {
    json.accessToken = accessToken;
  }
  if (schema) {
    json.schema = schema;
  }
  return json;
}
