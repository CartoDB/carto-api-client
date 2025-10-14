// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SOURCE_DEFAULTS} from '../sources/index.js';
import type {
  SourceOptions,
  QuerySourceOptions,
  QueryResult,
} from '../sources/types.js';
import {buildQueryUrl} from './endpoints.js';
import {requestWithParameters} from './request-with-parameters.js';
import type {APIErrorContext} from './carto-api-error.js';
import {getClient} from '../client.js';

export type QueryOptions = SourceOptions &
  QuerySourceOptions & {
    /**
     * @internal
     * @experimental
     * Used to append additional parameters to the SQL API request for features specific to providers or integrations.
     */
    internalParameters?: Record<string, string | boolean | number>;
    /** Used to abort the request. */
    signal?: AbortSignal;
  };
type UrlParameters = {
  q: string;
  queryParameters?: Record<string, unknown> | unknown[];
};

export const query = async function (
  options: QueryOptions
): Promise<QueryResult> {
  const {
    apiBaseUrl = SOURCE_DEFAULTS.apiBaseUrl,
    maxLengthURL = SOURCE_DEFAULTS.maxLengthURL,
    clientId = getClient(),
    localCache,
    connectionName,
    sqlQuery,
    queryParameters,
    internalParameters,
  } = options;
  const urlParameters: UrlParameters = {q: sqlQuery};

  if (queryParameters) {
    urlParameters.queryParameters = queryParameters;
  }

  const baseUrl = buildQueryUrl({apiBaseUrl, connectionName});
  const headers = {
    Authorization: `Bearer ${options.accessToken}`,
    ...options.headers,
  };
  const parameters = {
    client: clientId,
    ...options.tags,
    ...internalParameters,
    ...urlParameters,
  };

  const errorContext: APIErrorContext = {
    requestType: 'SQL',
    connection: options.connectionName,
    type: 'query',
    source: JSON.stringify(parameters, undefined, 2),
  };
  return await requestWithParameters<QueryResult>({
    baseUrl,
    parameters,
    headers,
    errorContext,
    maxLengthURL,
    localCache,
    signal: options.signal,
  });
};
