import {
  VectorTableSourceOptions,
  VectorQuerySourceOptions,
} from '@deck.gl/carto';

export type $TODO = any;

export type CartoDataViewProps = {};

export type TableDataViewProps = CartoDataViewProps &
  VectorTableSourceOptions & {
    tableName: string;
    onFilterChange?: (filters: Record<string, unknown>) => void;
  };

export type QueryDataViewProps = CartoDataViewProps &
  VectorQuerySourceOptions & {
    sqlQuery: string;
    onFilterChange?: (filters: Record<string, unknown>) => void;
  };

export interface DataView {}
