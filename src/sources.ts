import {
  vectorTableSource as _vectorTableSource,
  vectorQuerySource as _vectorQuerySource,
  VectorTableSourceOptions,
  VectorQuerySourceOptions,
} from '@deck.gl/carto';
import {QueryDataView, TableDataView} from './data-view.js';

/******************************************************************************
 * VECTOR SOURCES
 */

type _VectorTableSourceResponse = Awaited<
  ReturnType<typeof _vectorTableSource>
>;
export type VectorTableSourceResponse = _VectorTableSourceResponse & {
  dataView: TableDataView;
};

type _VectorQuerySourceResponse = Awaited<
  ReturnType<typeof _vectorQuerySource>
>;
export type VectorQuerySourceResponse = _VectorQuerySourceResponse & {
  dataView: QueryDataView;
};

export async function vectorTableSource(
  props: VectorTableSourceOptions
): Promise<VectorTableSourceResponse> {
  return {
    ...(await _vectorTableSource(props)),
    dataView: new TableDataView(props),
  };
}

export async function vectorQuerySource(
  props: VectorQuerySourceOptions
): Promise<VectorQuerySourceResponse> {
  return {
    ...(await _vectorQuerySource(props)),
    dataView: new QueryDataView(props),
  };
}

export const vectorTilesetSource = () => {
  throw new Error('not implemented');
};

/******************************************************************************
 * H3 SOURCES
 */

export const h3TableSource = () => {
  throw new Error('not implemented');
};
export const h3QuerySource = () => {
  throw new Error('not implemented');
};
export const h3TilesetSource = () => {
  throw new Error('not implemented');
};

/******************************************************************************
 * QUADBIN SOURCES
 */

export const quadbinTableSource = () => {
  throw new Error('not implemented');
};
export const quadbinQuerySource = () => {
  throw new Error('not implemented');
};
export const quadbinTilesetSource = () => {
  throw new Error('not implemented');
};
