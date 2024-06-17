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
import {WidgetBaseSourceProps} from './widget-base-source.js';
import {WidgetQuerySource} from './widget-query-source.js';
import {WidgetTableSource} from './widget-table-source.js';

/******************************************************************************
 * RESPONSE OBJECTS
 */

type WidgetTableSourceResponse = {widgetSource: WidgetTableSource};
type WidgetQuerySourceResponse = {widgetSource: WidgetQuerySource};

export type VectorTableSourceResponse = WidgetTableSourceResponse &
  Awaited<ReturnType<typeof _vectorTableSource>>;
export type VectorQuerySourceResponse = WidgetQuerySourceResponse &
  Awaited<ReturnType<typeof _vectorQuerySource>>;

export type H3TableSourceResponse = WidgetTableSourceResponse &
  Awaited<ReturnType<typeof _h3TableSource>>;
export type H3QuerySourceResponse = WidgetQuerySourceResponse &
  Awaited<ReturnType<typeof _h3QuerySource>>;

export type QuadbinTableSourceResponse = WidgetTableSourceResponse &
  Awaited<ReturnType<typeof _quadbinTableSource>>;
export type QuadbinQuerySourceResponse = WidgetQuerySourceResponse &
  Awaited<ReturnType<typeof _quadbinQuerySource>>;

/******************************************************************************
 * VECTOR SOURCES
 */

/** Wrapper adding widget support to {@link _vectorTableSource}. */
export async function vectorTableSource(
  props: VectorTableSourceOptions & WidgetBaseSourceProps
): Promise<VectorTableSourceResponse> {
  const response = await _vectorTableSource(props);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding widget support to {@link _vectorQuerySource}. */
export async function vectorQuerySource(
  props: VectorQuerySourceOptions & WidgetBaseSourceProps
): Promise<VectorQuerySourceResponse> {
  const response = await _vectorQuerySource(props);
  return {...response, widgetSource: new WidgetQuerySource(props)};
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
  props: H3TableSourceOptions & WidgetBaseSourceProps
): Promise<H3TableSourceResponse> {
  const response = await _h3TableSource(props);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding widget support to {@link _h3QuerySource}. */
export async function h3QuerySource(
  props: H3QuerySourceOptions & WidgetBaseSourceProps
): Promise<H3QuerySourceResponse> {
  const response = await _h3QuerySource(props);
  return {...response, widgetSource: new WidgetQuerySource(props)};
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
  props: QuadbinTableSourceOptions & WidgetBaseSourceProps
): Promise<QuadbinTableSourceResponse> {
  const response = await _quadbinTableSource(props);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding widget support to {@link _quadbinQuerySource}. */
export async function quadbinQuerySource(
  props: QuadbinQuerySourceOptions & WidgetBaseSourceProps
): Promise<QuadbinQuerySourceResponse> {
  const response = await _quadbinQuerySource(props);
  return {...response, widgetSource: new WidgetQuerySource(props)};
}

/** Wrapper adding widget support to {@link _quadbinTilesetSource}. */
export async function quadbinTilesetSource() {
  throw new Error('not implemented');
}
