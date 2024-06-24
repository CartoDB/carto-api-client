import {executeModel} from '../models/index.js';
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
} from './types.js';
import {Source, FilterLogicalOperator, Credentials, Filter} from '../types.js';
import {SourceOptions} from '@deck.gl/carto';
import {getApplicableFilters, normalizeObjectKeys} from '../utils.js';
import {ApiVersion, MapType} from '../constants.js';
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_GEO_COLUMN,
} from '../constants-internal.js';
import {getClient} from '../client.js';
import {$TODO} from '../types-internal.js';

/**
 * TODO(cleanup): Consolidate {@link SourceOptions} and {@link Source}.
 */
export interface WidgetBaseSourceProps extends SourceOptions, Credentials {
  type?: MapType;
  filtersLogicalOperator?: FilterLogicalOperator;
  queryParameters?: unknown[];
  provider?: string;
  filters?: Record<string, Filter>;
}

export type WidgetSource = WidgetBaseSource<WidgetBaseSourceProps>;

export class WidgetBaseSource<Props extends WidgetBaseSourceProps> {
  readonly props: Props;
  readonly credentials: Required<Credentials> & {clientId: string};
  readonly connectionName: string;

  static defaultProps: Partial<WidgetBaseSourceProps> = {
    filters: {},
    filtersLogicalOperator: 'and',
  };

  constructor(props: Props) {
    this.props = {...WidgetBaseSource.defaultProps, ...props};
    this.connectionName = props.connectionName;
    this.credentials = {
      apiVersion: props.apiVersion || ApiVersion.V3,
      apiBaseUrl: props.apiBaseUrl || DEFAULT_API_BASE_URL,
      clientId: props.clientId || getClient(),
      accessToken: props.accessToken,
      geoColumn: props.geoColumn || DEFAULT_GEO_COLUMN,
    };
  }

  protected getSource(owner?: string): Source {
    return {
      ...(this.props as $TODO),
      filters: getApplicableFilters(owner, this.props.filters),
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

    type FormulaModelResponse = {rows: {value: number}[]};

    return executeModel({
      model: 'formula',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {column: column ?? '*', operation, operationExp},
      opts: {abortController},
    }).then((res: FormulaModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getCategories(
    props: CategoryRequestOptions
  ): Promise<CategoryResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {column, operation, operationColumn} = params;

    type CategoriesModelResponse = {rows: {name: string; value: number}[]};

    return executeModel({
      model: 'category',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {
        column,
        operation,
        operationColumn: operationColumn || column,
      },
      opts: {abortController},
    }).then((res: CategoriesModelResponse) => normalizeObjectKeys(res.rows));
  }

  async getRange(props: RangeRequestOptions): Promise<RangeResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {column} = params;

    type RangeModelResponse = {rows: {min: number; max: number}[]};

    return executeModel({
      model: 'range',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {column},
      opts: {abortController},
    }).then((res: RangeModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getTable(props: TableRequestOptions): Promise<TableResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {columns, sortBy, sortDirection, page = 0, rowsPerPage = 10} = params;

    type TableModelResponse = {
      rows: Record<string, number | string>[];
      metadata: {total: number};
    };

    return executeModel({
      model: 'table',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {
        column: columns,
        sortBy,
        sortDirection,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      },
      opts: {abortController},
    }).then((res: TableModelResponse) => ({
      rows: normalizeObjectKeys(res.rows),
      totalCount: res.metadata.total,
    }));
  }

  async getScatter(props: ScatterRequestOptions): Promise<ScatterResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {xAxisColumn, xAxisJoinOperation, yAxisColumn, yAxisJoinOperation} =
      params;

    // Make sure this is sync with the same constant in cloud-native/maps-api
    const HARD_LIMIT = 500;

    type ScatterModelResponse = {rows: {x: number; y: number}[]};

    return executeModel({
      model: 'scatterplot',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {
        xAxisColumn,
        xAxisJoinOperation,
        yAxisColumn,
        yAxisJoinOperation,
        limit: HARD_LIMIT,
      },
      opts: {abortController},
    })
      .then((res: ScatterModelResponse) => normalizeObjectKeys(res.rows))
      .then((res) => res.map(({x, y}: {x: number; y: number}) => [x, y]));
  }

  async getTimeSeries(
    props: TimeSeriesRequestOptions
  ): Promise<TimeSeriesResponse> {
    const {filterOwner, abortController, spatialFilter, ...params} = props;
    const {
      column,
      operationColumn,
      joinOperation,
      operation,
      stepSize,
      stepMultiplier,
      splitByCategory,
      splitByCategoryLimit,
      splitByCategoryValues,
    } = params;

    type TimeSeriesModelResponse = {
      rows: {name: string; value: number}[];
      metadata: {categories: string[]};
    };

    return executeModel({
      model: 'timeseries',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {
        column,
        stepSize,
        stepMultiplier,
        operationColumn: operationColumn || column,
        joinOperation,
        operation,
        splitByCategory,
        splitByCategoryLimit,
        splitByCategoryValues,
      },
      opts: {abortController},
    }).then((res: TimeSeriesModelResponse) => ({
      rows: normalizeObjectKeys(res.rows),
      categories: res.metadata?.categories,
    }));
  }

  async getHistogram(
    props: HistogramRequestOptions
  ): Promise<HistogramResponse> {
    const {filterOwner, spatialFilter, abortController, ...params} = props;
    const {column, operation, ticks} = params;

    type HistogramModelResponse = {rows: {tick: number; value: number}[]};

    const data = await executeModel({
      model: 'histogram',
      source: this.getSource(filterOwner),
      spatialFilter,
      params: {column, operation, ticks},
      opts: {abortController},
    }).then((res: HistogramModelResponse) => normalizeObjectKeys(res.rows));

    if (data.length) {
      // Given N ticks the API returns up to N+1 bins, omitting any empty bins. Bins
      // include 1 bin below the lowest tick, N-1 between ticks, and 1 bin above the highest tick.
      const result = Array(ticks.length + 1).fill(0);
      data.forEach(
        ({tick, value}: {tick: number; value: number}) => (result[tick] = value)
      );
      return result;
    }

    return [];
  }
}
