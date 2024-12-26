import {filterFunctions} from './FilterTypes';
import {Filter, FilterLogicalOperator, Filters} from '../types';
import {Feature} from 'geojson';
import {FilterType} from '../constants';

const LOGICAL_OPERATOR_METHODS: Record<
  FilterLogicalOperator,
  'every' | 'some'
> = {
  and: 'every',
  or: 'some',
};

function passesFilter(
  columns: string[],
  filters: Filters,
  feature: Record<string, unknown>, // TODO(types)
  filtersLogicalOperator: FilterLogicalOperator
): boolean {
  const method = LOGICAL_OPERATOR_METHODS[filtersLogicalOperator];
  return columns[method]((column) => {
    const columnFilters = filters[column];
    const columnFilterTypes = Object.keys(columnFilters) as FilterType[];

    if (!feature || feature[column] === null || feature[column] === undefined) {
      return false;
    }

    return columnFilterTypes.every((filter) => {
      const filterFunction = filterFunctions[filter];

      if (!filterFunction) {
        throw new Error(`"${filter}" filter is not implemented.`);
      }

      return filterFunction(
        columnFilters[filter]!.values,
        feature[column],
        // TODO(types): Better types available?
        (columnFilters[filter] as any).params
      );
    });
  });
}

export function buildFeatureFilter({
  filters = {},
  type = 'boolean',
  filtersLogicalOperator = 'and',
}: {
  filters?: Filters;
  type?: string; // TODO
  filtersLogicalOperator?: FilterLogicalOperator;
}) {
  const columns = Object.keys(filters);

  if (!columns.length) {
    return () => (type === 'number' ? 1 : true);
  }

  return (feature: Record<string, unknown> | Feature) => {
    // TODO(types)
    const f = feature.properties || feature;
    const featurePassesFilter = passesFilter(
      columns,
      filters,
      f as Record<string, unknown>, // TODO(types)
      filtersLogicalOperator
    );

    return type === 'number'
      ? Number(featurePassesFilter)
      : featurePassesFilter;
  };
}

// Apply certain filters to a collection of features
export function applyFilters(
  features: Feature[],
  filters: Filters,
  filtersLogicalOperator: FilterLogicalOperator
) {
  return Object.keys(filters).length
    ? features.filter(buildFeatureFilter({filters, filtersLogicalOperator}))
    : features;
}

// Binary
export function buildBinaryFeatureFilter({filters = {}}: {filters: Filters}) {
  const columns = Object.keys(filters);

  if (!columns.length) {
    return () => 1;
  }

  return (featureIdIdx: string, binaryData: unknown) =>
    passesFilterUsingBinary(columns, filters, featureIdIdx, binaryData);
}

function getValueFromNumericProps(
  featureIdIdx: string,
  binaryData: unknown,
  {column}: {column: string}
) {
  // TODO(types): What is this type?
  return (binaryData as any).numericProps[column]?.value[featureIdIdx];
}

function getValueFromProperties(
  featureIdIdx: string,
  binaryData: unknown,
  {column}: {column: string}
) {
  // TODO(types): What is this type?
  const propertyIdx = (binaryData as any).featureIds.value[featureIdIdx];
  // TODO(types): What is this type?
  return (binaryData as any).properties[propertyIdx]?.[column];
}

const GET_VALUE_BY_BINARY_PROP = {
  properties: getValueFromProperties,
  numericProps: getValueFromNumericProps,
};

function getBinaryPropertyByFilterValues(filterValues: unknown[]) {
  return typeof filterValues.flat()[0] === 'string'
    ? 'properties'
    : 'numericProps';
}

function getFeatureValue(
  featureIdIdx: string,
  binaryData: any,
  filter: {type: FilterType; column: string; values: unknown[]} // TODO(types): What is this?
) {
  const {column, values} = filter;
  const binaryProp = getBinaryPropertyByFilterValues(values);
  const getFeatureValueFn = GET_VALUE_BY_BINARY_PROP[binaryProp];
  return getFeatureValueFn(featureIdIdx, binaryData, {column});
}

// TODO(types): Types for binaryData?
function passesFilterUsingBinary(
  columns: string[],
  filters: Filters,
  featureIdIdx: string,
  binaryData: any
) {
  return columns.every((column) => {
    const columnFilters = filters[column];

    return Object.entries(columnFilters).every(([type, {values}]) => {
      const filterFn = filterFunctions[type as FilterType];
      if (!filterFn) {
        throw new Error(`"${type}" filter is not implemented.`);
      }

      if (!values) return 0;

      const featureValue = getFeatureValue(featureIdIdx, binaryData, {
        type: type as FilterType,
        column,
        values,
      });

      if (featureValue === undefined || featureValue === null) return 0;

      return filterFn(values, featureValue);
    });
  });
}
