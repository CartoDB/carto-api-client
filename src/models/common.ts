import {Credentials} from '../types';
import {InvalidColumnError} from '../vendor/carto-react-core';

/** @internalRemarks Source: @carto/react-api */
export interface ModelRequestOptions {
  method: 'GET' | 'POST';
  abortController?: AbortController;
  otherOptions?: Record<string, unknown>;
  body?: string;
}

/**
 * Return more descriptive error from API
 * @internalRemarks Source: @carto/react-api
 */
export function dealWithApiError({
  response,
  data,
}: {
  response: Response;
  data: any;
}) {
  if (data.error === 'Column not found') {
    throw new InvalidColumnError(`${data.error} ${data.column_name}`);
  }

  if (data.error?.includes('Missing columns')) {
    throw new InvalidColumnError(data.error);
  }

  switch (response.status) {
    case 401:
      throw new Error('Unauthorized access. Invalid credentials');
    case 403:
      throw new Error('Forbidden access to the requested data');
    default:
      const msg =
        data && data.error && typeof data.error === 'string'
          ? data.error
          : JSON.stringify(data?.hint || data.error?.[0]);
      throw new Error(msg);
  }
}

/** @internalRemarks Source: @carto/react-api */
export function checkCredentials(credentials: Credentials) {
  if (!credentials || !credentials.apiBaseUrl || !credentials.accessToken) {
    throw new Error('Missing or bad credentials provided');
  }
}

/** @internalRemarks Source: @carto/react-api */
export async function makeCall({
  url,
  credentials,
  opts,
}: {
  url: string;
  credentials: Credentials;
  opts: ModelRequestOptions;
}) {
  let response;
  let data;
  const isPost = opts?.method === 'POST';
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        ...(isPost ? {'Content-Type': 'application/json'} : {}),
      },
      ...(isPost
        ? {
            method: opts?.method,
            body: opts?.body,
          }
        : {}),
      signal: opts?.abortController?.signal,
      ...opts?.otherOptions,
    });
    data = await response.json();
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;

    throw new Error(`Failed request: ${error}`);
  }

  if (!response.ok) {
    dealWithApiError({response, data});
  }

  return data;
}
