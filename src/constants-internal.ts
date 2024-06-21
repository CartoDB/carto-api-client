import {FilterTypes} from './types';

/** @internal */
export const FILTER_TYPES = new Set(Object.values(FilterTypes));

/**
 * Threshold to use GET requests, vs POST
 * @internalRemarks Source: @carto/constants
 * @internal
 */
export const REQUEST_GET_MAX_URL_LENGTH = 2048;

/**
 * @internalRemarks Source: @carto/constants
 * @internal
 */
export const DEFAULT_API_BASE_URL = 'https://gcp-us-east1.api.carto.com';

/**
 * @internalRemarks Source: @carto/constants
 * @internal
 */
export const DEFAULT_CLIENT = 'deck-gl-carto';

/**
 * @internalRemarks Source: @carto/react-api
 * @internal
 */
export const DEFAULT_GEO_COLUMN = 'geom';
