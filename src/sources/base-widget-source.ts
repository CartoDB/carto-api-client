import {executeModel} from '../vendor/carto-react-api.js';
import {
  formatResult,
  normalizeObjectKeys,
} from '../vendor/carto-react-widgets.js';
import {
  CategoryRequestOptions,
  CategoryResponse,
  FormulaRequestOptions,
  FormulaResponse,
  HistogramRequestOptions,
  HistogramResponse,
  RangeRequestOptions,
  RangeResponse,
  ScatterRequestOptions,
  ScatterResponse,
  TableRequestOptions,
  TableResponse,
  TimeSeriesRequestOptions,
  TimeSeriesResponse,
} from '../types.js';
import {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_CLIENT,
  MAP_TYPES,
} from '../vendor/carto-constants.js';
import {SourceOptions} from '@deck.gl/carto';
import {getWidgetFilters} from '../utils.js';
import {Filter} from '../vendor/deck-carto.js';
import {$TODO} from '../types-internal.js';

/**
 *
 */
export interface BaseWidgetSourceProps extends SourceOptions {
  type?: MAP_TYPES;
  filtersLogicalOperator?: 'and' | 'or';
  queryParameters?: unknown[];
  geoColumn?: string;
  provider?: string;
  filters: Record<string, Filter>;
}

export type WidgetSource = BaseWidgetSource<BaseWidgetSourceProps>;

export class BaseWidgetSource<Props extends BaseWidgetSourceProps> {
  readonly props: Props;
  readonly credentials: {
    apiBaseUrl: string;
    apiVersion: API_VERSIONS;
    accessToken: string;
    clientId: string;
  };
  readonly connectionName: string;

  static defaultProps: Partial<BaseWidgetSourceProps> = {
    filters: {},
    filtersLogicalOperator: 'and',
  };

  constructor(props: Props) {
    this.props = {...BaseWidgetSource.defaultProps, ...props};
    this.credentials = {
      apiVersion: API_VERSIONS.V3,
      apiBaseUrl: DEFAULT_API_BASE_URL || props.apiBaseUrl,
      clientId: DEFAULT_CLIENT || props.clientId,
      accessToken: props.accessToken,
    };
    this.connectionName = props.connectionName;
  }

  protected getSource(owner: string): $TODO {
    return {
      ...(this.props as any),
      filters: getWidgetFilters(owner, (this.props as any).filters),
      credentials: this.credentials,
      connection: this.connectionName,
    };
  }

  async getFormula(props: FormulaRequestOptions): Promise<FormulaResponse> {
    const {
      filterOwner,
      spatialFilter,
      abortController,
      operationExp,
      ...params
    } = props;
    const {column, operation} = params;
    return executeModel({
      model: 'formula',
      source: this.getSource(filterOwner),
      spatialFilter: spatialFilter,
      params: {column: column ?? '*', operation, operationExp},
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows[0]));
  }

  async getCategories(
    props: CategoryRequestOptions
  ): Promise<CategoryResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {column, operation, operationColumn} = params;

    return executeModel({
      model: 'category',
      source: this.getSource(filterOwner),
      spatialFilter: spatialFilter,
      params: {
        column,
        operation,
        operationColumn: operationColumn || column,
      },
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows));
  }

  // TODO(test)
  async getRange(props: RangeRequestOptions): Promise<RangeResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {column} = params;

    return executeModel({
      model: 'range',
      source: this.getSource(filterOwner),
      spatialFilter: spatialFilter,
      params: {column},
      opts: {abortController},
    }).then((res: $TODO) => normalizeObjectKeys(res.rows[0]));
  }

  async getTable(props: TableRequestOptions): Promise<TableResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {columns, sortBy, sortDirection, page = 0, rowsPerPage = 10} = params;

    return executeModel({
      model: 'table',
      source: this.getSource(filterOwner),
      spatialFilter: spatialFilter,
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

  // TODO(implement)
  async getScatter(_props: ScatterRequestOptions): Promise<ScatterResponse> {
    throw new Error('TODO: implement');
  }

  // TODO(implement)
  async getTimeSeries(
    _props: TimeSeriesRequestOptions
  ): Promise<TimeSeriesResponse> {
    throw new Error('TODO: implement');
  }

  // TODO(implement)
  async getHistogram(
    _props: HistogramRequestOptions
  ): Promise<HistogramResponse> {
    throw new Error('TODO: implement');
  }
}
