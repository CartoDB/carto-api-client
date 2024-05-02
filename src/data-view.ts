import {executeModel} from './vendor/carto-react-api.js';
import {
  formatResult,
  normalizeObjectKeys,
} from './vendor/carto-react-widgets.js';
import {
  $TODO,
  CartoDataViewProps,
  DataView,
  QueryDataViewProps,
  TableDataViewProps,
} from './types.js';
import {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_CLIENT,
  MAP_TYPES,
} from './vendor/carto-constants.js';
import {WebMercatorViewport, MapViewState} from '@deck.gl/core';

// TODO: legacy
interface WidgetSource {
  id: string;
  data: string;
  type: MAP_TYPES;
  credentials: {
    apiVersion: API_VERSIONS;
    accessToken: string;
  };
  connection: string;
  filtersLogicalOperator: string;
  queryParameters: unknown[];
  geoColumn: string;
  provider: string;
  filters: Record<string, unknown>;
}

export class CartoDataView<Props extends CartoDataViewProps>
  implements DataView
{
  readonly props: Props;
  readonly credentials: {
    apiBaseUrl: string;
    apiVersion: API_VERSIONS;
    accessToken: string;
    clientId: string;
  };
  readonly connectionName: string;
  readonly viewState: MapViewState;
  constructor(props: Props) {
    this.props = props;
    this.credentials = {
      apiVersion: API_VERSIONS.V3,
      apiBaseUrl: DEFAULT_API_BASE_URL || props.apiBaseUrl,
      clientId: DEFAULT_CLIENT || props.clientId,
      accessToken: props.accessToken,
    };
    this.connectionName = props.connectionName;
    this.viewState = props.viewState;
  }
  protected getSource(props: $TODO): WidgetSource {
    return {
      ...props.source,
      credentials: this.credentials,
      connection: this.connectionName,
    };
  }
  protected getSpatialFilter(props: $TODO): $TODO {
    if (props.global) return null;

    const viewport = new WebMercatorViewport(this.viewState);
    return {
      type: 'Polygon',
      coordinates: [
        [
          viewport.unproject([0, 0]),
          viewport.unproject([viewport.width, 0]),
          viewport.unproject([viewport.width, viewport.height]),
          viewport.unproject([0, viewport.height]),
          viewport.unproject([0, 0]),
        ],
      ],
    };
  }
  getFormula(props: $TODO): $TODO {
    const {spatialFilter, abortController, operationExp, ...params} = props;
    const {column, operation} = params;
    return executeModel({
      model: 'formula',
      source: this.getSource(props),
      spatialFilter: this.getSpatialFilter(props),
      params: {column: column ?? '*', operation, operationExp},
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows[0]));
  }
  getCategories(props: $TODO): $TODO {
    const {spatialFilter, abortController, ...params} = props;
    const {column, operation, operationColumn} = params;

    return executeModel({
      model: 'category',
      source: this.getSource(props),
      spatialFilter,
      params: {
        column,
        operation,
        operationColumn: operationColumn || column,
      },
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows));
  }
  getRange(props: $TODO): $TODO {
    const {abortController, ...params} = props;
    const {column} = params;

    return executeModel({
      model: 'range',
      source: this.getSource(props),
      params: {column},
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows[0]));
  }
  getTable(props: $TODO): $TODO {
    const {spatialFilter, abortController, ...params} = props;
    const {columns, sortBy, sortDirection, page, rowsPerPage} = params;

    return executeModel({
      model: 'table',
      source: this.getSource(props),
      spatialFilter,
      params: {
        column: columns,
        sortBy,
        sortDirection,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      },
      opts: {abortController},
    })
      .then((res: $TODO) => ({
        rows: normalizeObjectKeys(res.rows),
        totalCount: res.metadata.total,
      }))
      .then(formatResult);
  }
  getScatter() {
    throw new Error('TODO: implement');
  }
  getTimeSeries() {
    throw new Error('TODO: implement');
  }
  getHistogram() {
    throw new Error('TODO: implement');
  }
}

export class TableDataView extends CartoDataView<TableDataViewProps> {
  constructor(props: TableDataViewProps) {
    super(props);
  }
}

export class QueryDataView extends CartoDataView<QueryDataViewProps> {
  constructor(props: QueryDataViewProps) {
    super(props);
  }
}
