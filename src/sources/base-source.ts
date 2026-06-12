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
  const parameters = {client: clientId, ...options.tags, ...urlParameters};

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
  errorContext.requestType = 'Map data';

  const json = await requestWithParameters<TilejsonResult>({
    baseUrl: dataUrl,
    parameters: {client: clientId},
    headers,
    errorContext,
    maxLengthURL,
    localCache,
    credentials,
  });
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
