import {executeModel} from '../models/index.js';
import {
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
import {normalizeObjectKeys} from '../utils.js';
import {DEFAULT_TILE_RESOLUTION} from '../constants-internal.js';
import {WidgetSource, WidgetSourceProps} from './widget-source.js';

export type WidgetRemoteSourceProps = WidgetSourceProps;

/**
 * Source for Widget API requests.
 *
 * Abstract class. Use {@link WidgetQuerySource} or {@link WidgetTableSource}.
 */
export abstract class WidgetRemoteSource<
  Props extends WidgetRemoteSourceProps
> extends WidgetSource<Props> {
  async getCategories(
    options: CategoryRequestOptions
  ): Promise<CategoryResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {column, operation, operationColumn} = params;
    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type CategoriesModelResponse = {rows: {name: string; value: number}[]};

    return executeModel({
      model: 'category',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column,
        operation,
        operationColumn: operationColumn || column,
      },
      opts: {abortController},
    }).then((res: CategoriesModelResponse) => normalizeObjectKeys(res.rows));
  }

  async getFeatures(
    options: FeaturesRequestOptions
  ): Promise<FeaturesResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {columns, dataType, featureIds, z, limit, tileResolution} = params;
    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type FeaturesModelResponse = {rows: Record<string, unknown>[]};

    return executeModel({
      model: 'pick',
      source: {
        ...source,
        spatialFiltersResolution,
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
      opts: {abortController},
      // Avoid `normalizeObjectKeys()`, which changes column names.
    }).then(({rows}: FeaturesModelResponse) => ({rows}));
  }

  async getFormula(options: FormulaRequestOptions): Promise<FormulaResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      operationExp,
      ...params
    } = options;
    const {column, operation} = params;
    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type FormulaModelResponse = {rows: {value: number}[]};

    return executeModel({
      model: 'formula',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {
        column: column ?? '*',
        operation: operation ?? 'count',
        operationExp,
      },
      opts: {abortController},
    }).then((res: FormulaModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getHistogram(
    options: HistogramRequestOptions
  ): Promise<HistogramResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {column, operation, ticks} = params;
    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type HistogramModelResponse = {rows: {tick: number; value: number}[]};

    const data = await executeModel({
      model: 'histogram',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
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

  async getRange(options: RangeRequestOptions): Promise<RangeResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {column} = params;
    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type RangeModelResponse = {rows: {min: number; max: number}[]};

    return executeModel({
      model: 'range',
      source: {
        ...source,
        spatialFiltersResolution,
        spatialFiltersMode,
        spatialFilter,
      },
      params: {column},
      opts: {abortController},
    }).then((res: RangeModelResponse) => normalizeObjectKeys(res.rows[0]));
  }

  async getScatter(options: ScatterRequestOptions): Promise<ScatterResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {xAxisColumn, xAxisJoinOperation, yAxisColumn, yAxisJoinOperation} =
      params;

    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    // Make sure this is sync with the same constant in cloud-native/maps-api
    const HARD_LIMIT = 500;

    type ScatterModelResponse = {rows: {x: number; y: number}[]};

    return executeModel({
      model: 'scatterplot',
      source: {
        ...source,
        spatialFiltersResolution,
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
      opts: {abortController},
    })
      .then((res: ScatterModelResponse) => normalizeObjectKeys(res.rows))
      .then((res) => res.map(({x, y}: {x: number; y: number}) => [x, y]));
  }

  async getTable(options: TableRequestOptions): Promise<TableResponse> {
    const {
      filterOwner,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      abortController,
      ...params
    } = options;
    const {columns, sortBy, sortDirection, offset = 0, limit = 10} = params;
    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type TableModelResponse = {
      rows: Record<string, number | string>[];
      metadata: {total: number};
    };

    return executeModel({
      model: 'table',
      source: {
        ...source,
        spatialFiltersResolution,
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
      opts: {abortController},
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
      filterOwner,
      abortController,
      spatialFilter,
      spatialFiltersMode,
      spatialIndexReferenceViewState,
      ...params
    } = options;
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

    const source = this.getModelSource(filterOwner);
    const spatialFiltersResolution = this._getSpatialFiltersResolution(
      source,
      spatialFilter,
      spatialIndexReferenceViewState
    );

    type TimeSeriesModelResponse = {
      rows: {name: string; value: number}[];
      metadata: {categories: string[]};
    };

    return executeModel({
      model: 'timeseries',
      source: {
        ...source,
        spatialFiltersResolution,
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
}