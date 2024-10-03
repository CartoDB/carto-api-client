import {
  ApiVersion,
  DEFAULT_GEO_COLUMN,
  MapType,
} from '../constants-internal.js';
import {
  Filter,
  FilterLogicalOperator,
  QueryParameters,
  SpatialFilter,
} from '../types.js';
import {$TODO} from '../types-internal.js';
import {assert} from '../utils.js';
import {ModelRequestOptions, makeCall} from './common.js';

/** @internalRemarks Source: @carto/react-api */
const AVAILABLE_MODELS = [
  'category',
  'histogram',
  'formula',
  'timeseries',
  'range',
  'scatterplot',
  'table',
] as const;

export type Model = (typeof AVAILABLE_MODELS)[number];

export interface ModelSource {
  type: MapType;
  apiVersion: ApiVersion;
  apiBaseUrl: string;
  accessToken: string;
  clientId: string;
  connectionName: string;
  data: string;
  filters?: Record<string, Filter>;
  filtersLogicalOperator?: FilterLogicalOperator;
  geoColumn?: string;
  spatialFilter?: SpatialFilter;
  queryParameters?: QueryParameters;
}

const {V3} = ApiVersion;
const REQUEST_GET_MAX_URL_LENGTH = 2048;

/**
 * Execute a SQL model request.
 * @internalRemarks Source: @carto/react-api
 */
export function executeModel(props: {
  model: Model;
  source: ModelSource;
  params: Record<string, unknown>;
  opts?: Partial<ModelRequestOptions>;
}) {
  assert(props.source, 'executeModel: missing source');
  assert(props.model, 'executeModel: missing model');
  assert(props.params, 'executeModel: missing params');

  assert(
    AVAILABLE_MODELS.includes(props.model),
    `executeModel: model provided isn't valid. Available models: ${AVAILABLE_MODELS.join(
      ', '
    )}`
  );

  const {model, source, params, opts} = props;
  const {type, apiVersion, apiBaseUrl, accessToken, connectionName, clientId} =
    source;

  assert(apiBaseUrl, 'executeModel: missing apiBaseUrl');
  assert(accessToken, 'executeModel: missing accessToken');
  assert(apiVersion === V3, 'executeModel: SQL Model API requires CARTO 3+');
  assert(type !== MapType.TILESET, 'executeModel: Tilesets not supported');

  let url = `${apiBaseUrl}/v3/sql/${connectionName}/model/${model}`;

  const {filters, filtersLogicalOperator = 'and', data} = source;
  const queryParameters = source.queryParameters
    ? JSON.stringify(source.queryParameters)
    : '';

  const queryParams: Record<string, string> = {
    type,
    client: clientId,
    source: data,
    params: JSON.stringify(params),
    queryParameters,
    filters: JSON.stringify(filters),
    filtersLogicalOperator,
  };

  // API supports multiple filters, we apply it only to geoColumn
  const spatialFilters = source.spatialFilter
    ? {
        [source.geoColumn ? source.geoColumn : DEFAULT_GEO_COLUMN]:
          source.spatialFilter,
      }
    : undefined;

  if (spatialFilters) {
    queryParams.spatialFilters = JSON.stringify(spatialFilters);
  }

  const urlWithSearchParams =
    url + '?' + new URLSearchParams(queryParams).toString();
  const isGet = urlWithSearchParams.length <= REQUEST_GET_MAX_URL_LENGTH;
  if (isGet) {
    url = urlWithSearchParams;
  } else {
    // undo the JSON.stringify, @TODO find a better pattern
    queryParams.params = params as $TODO;
    queryParams.filters = filters as $TODO;
    queryParams.queryParameters = source.queryParameters as $TODO;
    if (spatialFilters) {
      queryParams.spatialFilters = spatialFilters as $TODO;
    }
  }
  return makeCall({
    url,
    accessToken: source.accessToken,
    opts: {
      ...opts,
      method: isGet ? 'GET' : 'POST',
      ...(!isGet && {body: JSON.stringify(queryParams)}),
    },
  });
}
