export const CLIENT_ID = 'carto-api-client';

/** @internalRemarks Source: @carto/constants */
export enum MapType {
  TABLE = 'table',
  QUERY = 'query',
  TILESET = 'tileset',
}

/** @internalRemarks Source: @carto/constants */
export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

/** @internalRemarks Source: @carto/react-core */
export enum GroupDateType {
  YEARS = 'year',
  MONTHS = 'month',
  WEEKS = 'week',
  DAYS = 'day',
  HOURS = 'hour',
  MINUTES = 'minute',
  SECONDS = 'second',
}

/** @internalRemarks Source: @carto/react-api, @deck.gl/carto */
export enum FilterType {
  IN = 'in',
  /** [a, b] both are included. */
  BETWEEN = 'between',
  /** [a, b) a is included, b is not. */
  CLOSED_OPEN = 'closed_open',
  TIME = 'time',
  STRING_SEARCH = 'stringSearch',
}
