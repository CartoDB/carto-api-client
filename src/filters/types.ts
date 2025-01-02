export type TileTypedArray =
  | Float32Array
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Int32Array
  | Int16Array
  | Int8Array;

export type TileTypedArrayConstructor =
  | Float32ArrayConstructor
  | Uint32ArrayConstructor
  | Uint16ArrayConstructor
  | Uint8ArrayConstructor
  | Int32ArrayConstructor
  | Int16ArrayConstructor
  | Int8ArrayConstructor;

// TODO(docs): What does a TileMap represent?
export type TileMap = Map<unknown, unknown>;

/** Internal representation of deck.gl accessor. */
export type TileAccessor = {value: TileTypedArray; size: number};

export type TileGeometryType = 'Point' | 'LineString' | 'Polygon';

// TODO(docs): What does this represent? Does it correspond to a deck.gl type?
export type TileData = {
  properties: Record<string, unknown>;
  numericProps?: Record<string, TileAccessor>;
  fields?: Record<string, Record<string, unknown>>;
  featureIds: TileAccessor;
  positions: TileAccessor;
  primitivePolygonIndices?: TileAccessor;
  pathIndices?: TileAccessor;
  pointIndices?: TileAccessor;
};
