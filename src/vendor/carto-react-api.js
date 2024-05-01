import { assert, InvalidColumnError, getClient } from './carto-react-core';
import { MAP_TYPES, API_VERSIONS, REQUEST_GET_MAX_URL_LENGTH } from './carto-constants';

/******************************************************************************
 * model.js
 */

const AVAILABLE_MODELS = [
  'category',
  'histogram',
  'formula',
  'timeseries',
  'range',
  'scatterplot',
  'table'
];

const DEFAULT_GEO_COLUMN = 'geom';

/**
 * Execute a SQL model request.
 *
 * @typedef { import('geojson').Polygon | import('geojson').MultiPolygon } SpatialFilter
 * @param { object } props
 * @param { string } props.model - widget's model that we want to get the data for
 * @param { object } props.source - source that owns the column
 * @param { object } props.params - widget's props
 * @param { SpatialFilter= } props.spatialFilter - restrict widget calculation to an area
 * @param { object= } props.opts - Additional options for the HTTP request
 */
export function executeModel(props) {
  assert(props.source, 'executeModel: missing source');
  assert(props.model, 'executeModel: missing model');
  assert(props.params, 'executeModel: missing params');

  assert(
    AVAILABLE_MODELS.indexOf(props.model) !== -1,
    `executeModel: model provided isn't valid. Available models: ${AVAILABLE_MODELS.join(
      ', '
    )}`
  );

  const { source, model, params, spatialFilter, opts } = props;

  checkCredentials(source.credentials);

  assert(
    source.credentials.apiVersion === API_VERSIONS.V3,
    'SQL Model API is a feature only available in CARTO 3.'
  );
  assert(source.type !== MAP_TYPES.TILESET, 'executeModel: Tileset not supported');

  let url = `${source.credentials.apiBaseUrl}/v3/sql/${source.connection}/model/${model}`;

  const { filters, filtersLogicalOperator, data, type } = source;
  const queryParameters = source.queryParameters
    ? JSON.stringify(source.queryParameters)
    : '';
  let queryParams = {
    type,
    client: getClient(),
    source: data,
    params: JSON.stringify(params),
    queryParameters,
    filters: JSON.stringify(filters),
    filtersLogicalOperator
  };

  // API supports multiple filters, we apply it only to geoColumn
  const spatialFilters = spatialFilter
    ? {
        [source.geoColumn ? source.geoColumn : DEFAULT_GEO_COLUMN]: spatialFilter
      }
    : undefined;

  if (spatialFilters) {
    queryParams.spatialFilters = JSON.stringify(spatialFilters);
  }

  const urlWithSearchParams = url + '?' + new URLSearchParams(queryParams).toString();
  const isGet = urlWithSearchParams.length <= REQUEST_GET_MAX_URL_LENGTH;
  if (isGet) {
    url = urlWithSearchParams;
  } else {
    // undo the JSON.stringify, @todo find a better pattern
    queryParams.params = params;
    queryParams.filters = filters;
    queryParams.queryParameters = source.queryParameters;
    if (spatialFilters) {
      queryParams.spatialFilters = spatialFilters;
    }
  }
  return makeCall({
    url,
    credentials: source.credentials,
    opts: {
      ...opts,
      method: isGet ? 'GET' : 'POST',
      ...(!isGet && { body: JSON.stringify(queryParams) })
    }
  });
}

/******************************************************************************
 * common.js
 */

 /**
  * Return more descriptive error from API
  */
 export function dealWithApiError({ response, data }) {
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

 export function checkCredentials(credentials) {
   if (!credentials || !credentials.apiBaseUrl || !credentials.accessToken) {
     throw new Error('Missing or bad credentials provided');
   }
 }

 export async function makeCall({ url, credentials, opts }) {
   let response;
   let data;
   const isPost = opts?.method === 'POST';
   try {
     response = await fetch(url.toString(), {
       headers: {
         Authorization: `Bearer ${credentials.accessToken}`,
         ...(isPost ? { 'Content-Type': 'application/json' } : {})
       },
       ...(isPost
         ? {
             method: opts?.method,
             body: opts?.body
           }
         : {}),
       signal: opts?.abortController?.signal,
       ...opts?.otherOptions
     });
     data = await response.json();
   } catch (error) {
     if (error.name === 'AbortError') throw error;

     throw new Error(`Failed request: ${error}`);
   }

   if (!response.ok) {
     dealWithApiError({ response, data });
   }

   return data;
 }

 export const CLIENT_ID = 'carto-for-react';
