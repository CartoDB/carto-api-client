import {executeModel, type ModelSource} from '../models/index.js';
import type {
  CategoryRequestOptions,
  CategoryResponse,
  FeaturesRequestOptions,
  FeaturesResponse,
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
import {assert, normalizeObjectKeys} from '../utils.js';
import {DEFAULT_TILE_RESOLUTION} from '../constants-internal.js';
import {WidgetSource, type WidgetSourceProps} from './widget-source.js';
import type {Filters} from '../types.js';
import {AggregationTypes, ApiVersion} from '../constants.js';
import {getApplicableFilters} from '../filters.js';

export type WidgetRemoteSourceProps = WidgetSourceProps;

/**
 * Source for Widget API requests.
 *
 * Abstract class. Use {@link WidgetQuerySource} or {@link WidgetTableSource}.
 */
export abstract class WidgetRemoteSource<
  Props extends WidgetRemoteSourceProps,
> extends WidgetSource<Props> {
  /**
   * Subclasses of {@link WidgetRemoteSource} must implement this method, calling
   * {@link WidgetRemoteSource.prototype._getModelSource} for common source
   * properties, and adding additional required properties including 'type' and
   * 'data'.
   */
  protected abstract getModelSource(
    filters: Filters | undefined,
    filterOwner?: string
  ): ModelSource;

  protected _getModelSource(
    filters: Filters | undefined,
    filterOwner?: string
  ): Omit<ModelSource, 'type' | 'data'> {
    const props = this.props;
    return {
      apiVersion: props.apiVersion as ApiVersion,
      apiBaseUrl: props.apiBaseUrl as string,
      clientId: props.clientId as string,
      accessToken: props.accessToken,
      connectionName: props.connectionName,
      filters: getApplicableFilters(filterOwner, filters || props.filters),
      filtersLogicalOperator: props.filtersLogicalOperator,
      spatialDataType: props.spatialDataType,
      spatialDataColumn: props.spatialDataColumn,
    };
  }

  async getCategories(
    options: CategoryRequestOptions
  ): Promise<CategoryResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {column, operation, operationColumn, operationExp} = params;

    if (operation === AggregationTypes.Custom) {
      assert(operationExp, 'operationExp is required for custom operation');
    }

    type CategoriesModelResponse = {rows: {name: string; value: number}[]};

    return executeModel({
      model: 'category',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column,
        operation,
        operationExp,
        operationColumn: operationColumn || column,
      },
      opts: {signal, headers: this.props.headers},
    }).then((res: CategoriesModelResponse) => normalizeObjectKeys(res.rows));
  }

  async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {columns, dataType, featureIds, z, limit, tileResolution} = params;

    type FeaturesModelResponse = {rows: Record<string, unknown>[]};

    return executeModel({
      model: 'pick',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        columns,
        dataType,
        featureIds,
        z,
        limit: limit || 1000,
        tileResolution: tileResolution || DEFAULT_TILE_RESOLUTION,
      },
      opts: {signal, headers: this.props.headers},
      // Avoid `normalizeObjectKeys()`, which changes column names.
    }).then(({rows}: FeaturesModelResponse) => ({rows}));
  }

  async getFormula(options: FormulaRequestOptions): Promise<FormulaResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      operationExp,
      ...params
    } = options;
    const {column, operation} = params;

    type FormulaModelResponse = {rows: {value: number}[]};

    if (operation === AggregationTypes.Custom) {
      assert(operationExp, 'operationExp is required for custom operation');
    }

    return executeModel({
      model: 'formula',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column: column ?? '*',
        operation: operation ?? AggregationTypes.Count,
        operationExp,
      },
      opts: {signal, headers: this.props.headers},
    }).then((res: FormulaModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getHistogram(
    options: HistogramRequestOptions
  ): Promise<HistogramResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {column, operation, ticks} = params;

    type HistogramModelResponse = {rows: {tick: number; value: number}[]};

    const data = await executeModel({
      model: 'histogram',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {column, operation, ticks},
      opts: {signal, headers: this.props.headers},
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

  async getRange(options: RangeRequestOptions): Promise<RangeResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {column} = params;

    type RangeModelResponse = {rows: {min: number; max: number}[]};

    return executeModel({
      model: 'range',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {column},
      opts: {signal, headers: this.props.headers},
    }).then((res: RangeModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getScatter(options: ScatterRequestOptions): Promise<ScatterResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {xAxisColumn, xAxisJoinOperation, yAxisColumn, yAxisJoinOperation} =
      params;

    // Make sure this is sync with the same constant in cloud-native/maps-api
    const HARD_LIMIT = 500;

    type ScatterModelResponse = {rows: {x: number; y: number}[]};

    return executeModel({
      model: 'scatterplot',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        xAxisColumn,
        xAxisJoinOperation,
        yAxisColumn,
        yAxisJoinOperation,
        limit: HARD_LIMIT,
      },
      opts: {signal, headers: this.props.headers},
    })
      .then((res: ScatterModelResponse) => normalizeObjectKeys(res.rows))
      .then((res) => res.map(({x, y}: {x: number; y: number}) => [x, y]));
  }

  async getTable(options: TableRequestOptions): Promise<TableResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {columns, sortBy, sortDirection, offset = 0, limit = 10} = params;

    type TableModelResponse = {
      rows: Record<string, number | string>[];
      metadata: {total: number};
    };

    return executeModel({
      model: 'table',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column: columns,
        sortBy,
        sortDirection,
        limit,
        offset,
      },
      opts: {signal, headers: this.props.headers},
    }).then((res: TableModelResponse) => ({
      // Avoid `normalizeObjectKeys()`, which changes column names.
      rows: res.rows ?? (res as any).ROWS,
      totalCount: res.metadata?.total ?? (res as any).METADATA?.TOTAL,
    }));
  }

  async getTimeSeries(
    options: TimeSeriesRequestOptions
  ): Promise<TimeSeriesResponse> {
    const {
      signal,
      filters = this.props.filters,
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      ...params
    } = options;
    const {
      column,
      operationColumn,
      joinOperation,
      operation,
      operationExp,
      stepSize,
      stepMultiplier,
      splitByCategory,
      splitByCategoryLimit,
      splitByCategoryValues,
    } = params;

    if (operation === AggregationTypes.Custom) {
      assert(operationExp, 'operationExp is required for custom operation');
    }

    type TimeSeriesModelResponse = {
      rows: {name: string; value: number}[];
      metadata: {categories: string[]};
    };

    return executeModel({
      model: 'timeseries',
      source: {
        ...this.getModelSource(filters, filterOwner),
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column,
        stepSize,
        stepMultiplier,
        operationColumn: operationColumn || column,
        joinOperation,
        operation,
        operationExp,
        splitByCategory,
        splitByCategoryLimit,
        splitByCategoryValues,
      },
      opts: {signal, headers: this.props.headers},
    }).then((res: TimeSeriesModelResponse) => ({
      rows: normalizeObjectKeys(res.rows),
      categories: res.metadata?.categories,
    }));
  }
}
