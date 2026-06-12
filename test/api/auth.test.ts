// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  buildAuthHeaders,
  getAuthCredentials,
  rewriteUrlForSessionMode,
} from '@carto/api-client';

describe('buildAuthHeaders', () => {
  test('token mode returns a Bearer header', () => {
    expect(buildAuthHeaders({accessToken: 'abc'})).toEqual({
      Authorization: 'Bearer abc',
    });
    expect(buildAuthHeaders({accessToken: 'abc', authMode: 'token'})).toEqual({
      Authorization: 'Bearer abc',
    });
  });

  test('session mode returns no headers', () => {
    expect(buildAuthHeaders({authMode: 'session'})).toEqual({});
  });

  test('throws without a token in token mode', () => {
    expect(() => buildAuthHeaders({})).toThrowError(/accessToken is required/);
  });

  test('throws when a token is passed in session mode', () => {
    expect(() =>
      buildAuthHeaders({accessToken: 'abc', authMode: 'session'})
    ).toThrowError(/must not be provided/);
  });
});

describe('getAuthCredentials', () => {
  test('session mode requests same-origin credentials', () => {
    expect(getAuthCredentials('session')).toBe('same-origin');
    expect(getAuthCredentials('token')).toBeUndefined();
    expect(getAuthCredentials(undefined)).toBeUndefined();
  });
});

describe('rewriteUrlForSessionMode', () => {
  test('replaces scheme and host with the configured base', () => {
    expect(
      rewriteUrlForSessionMode(
        'https://gcp-us-east1.api.carto.com/v3/maps/conn/table/{z}/{x}/{y}?name=a',
        '/app/_proxy/my-app'
      )
    ).toBe('/app/_proxy/my-app/v3/maps/conn/table/{z}/{x}/{y}?name=a');
  });

  test('strips trailing slashes from the base', () => {
    expect(rewriteUrlForSessionMode('https://host.com/v3/sql', '/proxy/')).toBe(
      '/proxy/v3/sql'
    );
  });

  test('leaves relative URLs unchanged', () => {
    expect(rewriteUrlForSessionMode('/v3/sql?q=1', '/proxy')).toBe(
      '/v3/sql?q=1'
    );
  });
});
