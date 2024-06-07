import {
  h3TableSource as _h3TableSource,
  h3QuerySource as _h3QuerySource,
  vectorTableSource as _vectorTableSource,
  vectorQuerySource as _vectorQuerySource,
  quadbinTableSource as _quadbinTableSource,
  quadbinQuerySource as _quadbinQuerySource,
  VectorTableSourceOptions,
  VectorQuerySourceOptions,
  H3TableSourceOptions,
  H3QuerySourceOptions,
  QuadbinQuerySourceOptions,
  QuadbinTableSourceOptions,
} from '@deck.gl/carto';
import {QueryWidgetSource} from './query-widget-source.js';
import {TableWidgetSource} from './table-widget-source.js';
import {BaseWidgetSourceProps} from './base-widget-source.js';

/******************************************************************************
 * RESPONSE OBJECTS
 */

type TableWidgetSourceResponse = {widgetSource: TableWidgetSource};
type QueryWidgetSourceResponse = {widgetSource: QueryWidgetSource};

export type VectorTableSourceResponse = TableWidgetSourceResponse &
  Awaited<ReturnType<typeof _vectorTableSource>>;
export type VectorQuerySourceResponse = QueryWidgetSourceResponse &
  Awaited<ReturnType<typeof _vectorQuerySource>>;

export type H3TableSourceResponse = TableWidgetSourceResponse &
  Awaited<ReturnType<typeof _h3TableSource>>;
export type H3QuerySourceResponse = QueryWidgetSourceResponse &
  Awaited<ReturnType<typeof _h3QuerySource>>;

export type QuadbinTableSourceResponse = TableWidgetSourceResponse &
  Awaited<ReturnType<typeof _quadbinTableSource>>;
export type QuadbinQuerySourceResponse = QueryWidgetSourceResponse &
  Awaited<ReturnType<typeof _quadbinQuerySource>>;

/******************************************************************************
 * VECTOR SOURCES
 */

/** Wrapper adding widget support to {@link _vectorTableSource}. */
export async function vectorTableSource(
  props: VectorTableSourceOptions & BaseWidgetSourceProps
): Promise<VectorTableSourceResponse> {
  const response = await _vectorTableSource(props);
  return {...response, widgetSource: new TableWidgetSource(props)};
}

/** Wrapper adding widget support to {@link _vectorQuerySource}. */
export async function vectorQuerySource(
  props: VectorQuerySourceOptions & BaseWidgetSourceProps
): Promise<VectorQuerySourceResponse> {
  const response = await _vectorQuerySource(props);
  return {...response, widgetSource: new QueryWidgetSource(props)};
}

/** Wrapper adding widget support to {@link _vectorTilesetSource}. */
export async function vectorTilesetSource() {
  throw new Error('not implemented');
}

/******************************************************************************
 * H3 SOURCES
 */

/** Wrapper adding widget support to {@link _h3TableSource}. */
export async function h3TableSource(
  props: H3TableSourceOptions & BaseWidgetSourceProps
): Promise<H3TableSourceResponse> {
  const response = await _h3TableSource(props);
  return {...response, widgetSource: new TableWidgetSource(props)};
}

/** Wrapper adding widget support to {@link _h3QuerySource}. */
export async function h3QuerySource(
  props: H3QuerySourceOptions & BaseWidgetSourceProps
): Promise<H3QuerySourceResponse> {
  const response = await _h3QuerySource(props);
  return {...response, widgetSource: new QueryWidgetSource(props)};
}

/** Wrapper adding widget support to {@link _h3TilesetSource}. */
export async function h3TilesetSource() {
  throw new Error('not implemented');
}

/******************************************************************************
 * QUADBIN SOURCES
 */

/** Wrapper adding widget support to {@link _quadbinTableSource}. */
export async function quadbinTableSource(
  props: QuadbinTableSourceOptions & BaseWidgetSourceProps
): Promise<QuadbinTableSourceResponse> {
  const response = await _quadbinTableSource(props);
  return {...response, widgetSource: new TableWidgetSource(props)};
}

/** Wrapper adding widget support to {@link _quadbinQuerySource}. */
export async function quadbinQuerySource(
  props: QuadbinQuerySourceOptions & BaseWidgetSourceProps
): Promise<QuadbinQuerySourceResponse> {
  const response = await _quadbinQuerySource(props);
  return {...response, widgetSource: new QueryWidgetSource(props)};
}

/** Wrapper adding widget support to {@link _quadbinTilesetSource}. */
export async function quadbinTilesetSource() {
  throw new Error('not implemented');
}
