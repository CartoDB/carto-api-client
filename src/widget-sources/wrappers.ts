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
  SourceOptions,
} from '../sources/index.js';
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

/** Wrapper adding Widget API support to [vectorTableSource](https://deck.gl/docs/api-reference/carto/data-sources). */
export async function vectorTableSource(
  props: VectorTableSourceOptions
): Promise<VectorTableSourceResponse> {
  const response = await _vectorTableSource(props as _VectorTableSourceOptions);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding Widget API support to [vectorQuerySource](https://deck.gl/docs/api-reference/carto/data-sources). */
export async function vectorQuerySource(
  props: VectorQuerySourceOptions
): Promise<VectorQuerySourceResponse> {
  const response = await _vectorQuerySource(props as _VectorQuerySourceOptions);
  return {...response, widgetSource: new WidgetQuerySource(props)};
}

/******************************************************************************
 * H3 SOURCES
 */

export type H3TableSourceOptions = WrappedSourceOptions<_H3TableSourceOptions>;
export type H3QuerySourceOptions = WrappedSourceOptions<_H3QuerySourceOptions>;

/** Wrapper adding Widget API support to [h3TableSource](https://deck.gl/docs/api-reference/carto/data-sources). */
export async function h3TableSource(
  props: H3TableSourceOptions
): Promise<H3TableSourceResponse> {
  const response = await _h3TableSource(props as _H3TableSourceOptions);
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding Widget API support to [h3QuerySource](https://deck.gl/docs/api-reference/carto/data-sources). */
export async function h3QuerySource(
  props: H3QuerySourceOptions
): Promise<H3QuerySourceResponse> {
  const response = await _h3QuerySource(props as _H3QuerySourceOptions);
  return {...response, widgetSource: new WidgetQuerySource(props)};
}

/******************************************************************************
 * QUADBIN SOURCES
 */

export type QuadbinTableSourceOptions =
  WrappedSourceOptions<_QuadbinTableSourceOptions>;

export type QuadbinQuerySourceOptions =
  WrappedSourceOptions<_QuadbinQuerySourceOptions>;

/** Wrapper adding Widget API support to [quadbinTableSource](https://deck.gl/docs/api-reference/carto/data-sources). */
export async function quadbinTableSource(
  props: QuadbinTableSourceOptions & WidgetBaseSourceProps
): Promise<QuadbinTableSourceResponse> {
  const response = await _quadbinTableSource(
    props as _QuadbinTableSourceOptions
  );
  return {...response, widgetSource: new WidgetTableSource(props)};
}

/** Wrapper adding Widget API support to [quadbinQuerySource](https://deck.gl/docs/api-reference/carto/data-sources). */
export async function quadbinQuerySource(
  props: QuadbinQuerySourceOptions & WidgetBaseSourceProps
): Promise<QuadbinQuerySourceResponse> {
  const response = await _quadbinQuerySource(
    props as _QuadbinQuerySourceOptions
  );
  return {...response, widgetSource: new WidgetQuerySource(props)};
}
