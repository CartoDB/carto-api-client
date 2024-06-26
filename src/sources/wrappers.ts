import {
  h3TableSource as _h3TableSource,
  h3QuerySource as _h3QuerySource,
  vectorTableSource as _vectorTableSource,
  vectorQuerySource as _vectorQuerySource,
  quadbinTableSource as _quadbinTableSource,
  quadbinQuerySource as _quadbinQuerySource,
  VectorTableSourceOptions as _VectorTableSourceOptions,
  VectorQuerySourceOptions as _VectorQuerySourceOptions,
  H3TableSourceOptions as _H3TableSourceOptions,
  H3QuerySourceOptions as _H3QuerySourceOptions,
  QuadbinTableSourceOptions as _QuadbinTableSourceOptions,
  QuadbinQuerySourceOptions as _QuadbinQuerySourceOptions,
} from '@deck.gl/carto';
import {WidgetBaseSourceProps} from './widget-base-source.js';
import {WidgetQuerySource} from './widget-query-source.js';
import {WidgetTableSource} from './widget-table-source.js';

type WrappedSourceOptions<T> = Omit<T, 'filters'> & WidgetBaseSourceProps;

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

export type VectorTableSourceOptions =
  WrappedSourceOptions<_VectorTableSourceOptions>;

export type VectorQuerySourceOptions =
  WrappedSourceOptions<_VectorQuerySourceOptions>;

/** Wrapper adding widget support to {@link _vectorTableSource}. */
export async function vectorTableSource(
  props: VectorTableSourceOptions
): Promise<VectorTableSourceResponse> {
  const response = await _vectorTableSource(props as _VectorTableSourceOptions);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding widget support to {@link _vectorQuerySource}. */
export async function vectorQuerySource(
  props: VectorQuerySourceOptions
): Promise<VectorQuerySourceResponse> {
  const response = await _vectorQuerySource(props as _VectorQuerySourceOptions);
  return {...response, widgetSource: new WidgetQuerySource(props)};
}

/** Wrapper adding widget support to {@link _vectorTilesetSource}. */
export async function vectorTilesetSource() {
  throw new Error('not implemented');
}

/******************************************************************************
 * H3 SOURCES
 */

export type H3TableSourceOptions = WrappedSourceOptions<_H3TableSourceOptions>;
export type H3QuerySourceOptions = WrappedSourceOptions<_H3QuerySourceOptions>;

/** Wrapper adding widget support to {@link _h3TableSource}. */
export async function h3TableSource(
  props: H3TableSourceOptions
): Promise<H3TableSourceResponse> {
  const response = await _h3TableSource(props);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding widget support to {@link _h3QuerySource}. */
export async function h3QuerySource(
  props: H3QuerySourceOptions
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

export type QuadbinTableSourceOptions =
  WrappedSourceOptions<_QuadbinTableSourceOptions>;

export type QuadbinQuerySourceOptions =
  WrappedSourceOptions<_QuadbinQuerySourceOptions>;

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
