import {SchemaFieldType, type Filter, type SchemaField} from './types.js';
import {FilterType} from './constants.js';
import type {SpatialDataType} from './sources/types.js';

const FILTER_TYPES = new Set(Object.values(FilterType));
const isFilterType = (type: string): type is FilterType =>
  FILTER_TYPES.has(type as FilterType);

/**
 * @privateRemarks Source: @carto/react-widgets
 * @internal
 */
export function getApplicableFilters(
  owner?: string,
  filters?: Record<string, Filter>
): Record<string, Filter> {
  if (!filters) return {};

  const applicableFilters: Record<string, Filter> = {};

  for (const column in filters) {
    for (const type in filters[column]) {
      if (!isFilterType(type)) continue;

      const filter = filters[column][type];
      const isApplicable = !owner || !filter?.owner || filter?.owner !== owner;
      if (filter && isApplicable) {
        applicableFilters[column] ||= {};
        (applicableFilters[column][type] as typeof filter) = filter;
      }
    }
  }

  return applicableFilters;
}

type Row<T> = Record<string, T> | Record<string, T>[] | T[] | T;

/**
 * Due to each data warehouse having its own behavior with columns,
 * we need to normalize them and transform every key to lowercase.
 *
 * @privateRemarks Source: @carto/react-widgets
 * @internal
 */
export function normalizeObjectKeys<T, R extends Row<T>>(el: R): R {
  if (Array.isArray(el)) {
    return el.map((value) => normalizeObjectKeys(value)) as R;
  } else if (typeof el !== 'object') {
    return el;
  }

  return Object.entries(el as Record<string, T>).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] =
        typeof value === 'object' && value ? normalizeObjectKeys(value) : value;
      return acc;
    },
    {} as Record<string, T>
  ) as R;
}

/** @privateRemarks Source: @carto/react-core */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @privateRemarks Source: @carto/react-core
 * @internal
 */
export class InvalidColumnError extends Error {
  protected static readonly NAME = 'InvalidColumnError';

  constructor(message: string) {
    super(`${InvalidColumnError.NAME}: ${message}`);
    this.name = InvalidColumnError.NAME;
  }

  static is(error: unknown) {
    return (
      error instanceof InvalidColumnError ||
      (error as Error).message?.includes(InvalidColumnError.NAME)
    );
  }
}

export function isEmptyObject(object: object): boolean {
  for (const _ in object) {
    return false;
  }
  return true;
}

/** @internal */
export const isObject: (x: unknown) => boolean = (x) =>
  x !== null && typeof x === 'object';

/** @internal */
export const isPureObject: (x: any) => boolean = (x) =>
  isObject(x) && x.constructor === {}.constructor;

/**
 * Merges one or more source objects into a target object. Unlike `Object.assign`, does not
 * assign properties with undefined values. Null values will overwrite existing properties.
 */
export function assignOptional<T extends object, U, V>(
  target: T,
  source1: U,
  source2: V
): T & U & V;
export function assignOptional<T extends object, U>(
  target: T,
  source: U
): T & U;
export function assignOptional<T extends object, U>(
  target: T,
  ...sources: any[]
): any {
  for (const source of sources) {
    for (const key in source) {
      if (source[key] !== undefined) {
        (target as Record<string, unknown>)[key] = source[key];
      }
    }
  }
  return target as T & U;
}

/**
 * Returns the spatialDataType expected for widget operations, given layer source props. The
 * spatialDataType used in widget operations may be different from that of the layer. For
 * dynamically aggregated point datasets, widgets use type 'geo', not the aggregation type.
 */
export function getWidgetSpatialDataType(
  spatialDataType: SpatialDataType,
  spatialDataColumn: string,
  schema: SchemaField[]
): SpatialDataType {
  const field = schema.find((field) => field.name === spatialDataColumn);
  if (field && field.type === SchemaFieldType.Geometry) {
    return 'geo';
  }

  return spatialDataType;
}
