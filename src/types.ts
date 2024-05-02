import {
  VectorTableSourceOptions,
  VectorQuerySourceOptions,
  SourceOptions,
} from '@deck.gl/carto';
import { MapViewState } from '@deck.gl/core';

export type $TODO = any;

export type CartoDataViewProps = SourceOptions & {
  viewState: MapViewState;
};

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
