import type {RasterMetadata, RasterMetadataBand} from '../sources/types.js';

import {
  createVecExprEvaluator,
  type VecExprResult,
  type VecExprVecLike,
} from './vec-expr-evaluator.js';
import type {
  ColorBand,
  ColorRange,
  MapLayerConfig,
  RasterLayerConfigColorBand,
  VisualChannels,
} from './types.js';
import {createColorScale, type ScaleType} from './layer-map.js';
import {getLog10ScaleSteps} from './utils.js';

const UNKNOWN_COLOR = [134, 141, 145];

const RASTER_COLOR_BANDS = ['red', 'green', 'blue'] as const;

function getHasDataPredicate(noData: number | string | undefined) {
  if (noData === 'nan') {
    return (v: number) => !isNaN(v);
  }
  if (typeof noData === 'string') {
    noData = parseFloat(noData);
  }
  if (typeof noData === 'number') {
    return (v: number) => v !== noData && !isNaN(v);
  }

  return () => true;
}

// this is data as seen in RasterLayer
type RasterLayerData = {
  blockSize: number;
  cells: BinaryDataCells;
};

// this is data as seen in RasterColumnLayer - the one that actually renders pixels
// (binary data is just wrapped)
type RasterColumnLayerData = {
  length: number; // number of pixels
  data: RasterLayerData;

  // used to store buffers directly to be used by deck.gl, so we can skip accessors
  attributes?: Record<string, ArrayLike<number>>;

  // temporary storage for expression results filled in dataTransform
  expressionEvalContext?: Record<string, ArrayLike<number>>;
  customExpressionResults?: Record<string, VecExprResult>;
};

type BinaryDataCells = {
  numericProps: Record<string, {value: VecExprVecLike}>;
};

function createRasterColumnLayerDataTransform(
  transform: (dataWrapped: RasterColumnLayerData) => RasterColumnLayerData
) {
  return (data: RasterLayerData | RasterColumnLayerData) => {
    if (!data || !('data' in data) || !data?.data?.cells?.numericProps) {
      // we're in RasterLayer, or we've got invalid data
      return data as RasterLayerData;
    }
    // we only transform data when in RasterColumnLayer
    return transform(data);
  };
}

function createEvaluationContext(
  numericProps: Record<string, {value: VecExprVecLike}>,
  noData: number | string | undefined
) {
  // Optimization note
  // Seems like Array.from(256k+typed array takes even 15ms), so _we_ can afford to copy the array if we really don't need it to
  // only copy values to array only if we really see nodata in all bands
  const hasData = getHasDataPredicate(noData);
  const bands = Object.entries(numericProps).map(([bandName, {value}]) => ({
    bandName,
    values: value,
    copied: false,
  }));

  const length = bands[0].values.length;

  for (let i = 0; i < length; i++) {
    let hasSomeData = false;
    for (let j = 0; j < bands.length; j++) {
      hasSomeData = hasSomeData || hasData(bands[j].values[i]);
    }
    if (!hasSomeData) {
      for (let j = 0; j < bands.length; j++) {
        if (!bands[j].copied) {
          bands[j].copied = true;
          bands[j].values = Array.from(bands[j].values);
        }
        bands[j].values[i] = NaN;
      }
    }
  }

  const context = bands.reduce(
    (agg, {bandName, values}) => {
      agg[bandName] = values;
      return agg;
    },
    {} as Record<string, ArrayLike<number>>
  );
  return context;
}

function createExprDataTransform({
  colorBand,
  rasterMetadata,
  usedSymbols,
}: {
  colorBand: RasterLayerConfigColorBand | null | undefined;
  rasterMetadata: RasterMetadata;
  usedSymbols: string[];
}) {
  if (!colorBand || !colorBand.type || colorBand.type === 'none') {
    return undefined;
  }

  const expr = colorBand?.type === 'expression' ? colorBand.value : undefined;
  const vecExprEvaluator = expr ? createVecExprEvaluator(expr) : undefined;

  const dataTransform = createRasterColumnLayerDataTransform(
    (dataWrapped: RasterColumnLayerData) => {
      const data = dataWrapped.data;
      if (expr) {
        const cachedResult = dataWrapped.customExpressionResults?.[expr];
        if (cachedResult) {
          return dataWrapped;
        }
      }

      let context = dataWrapped.expressionEvalContext;
      if (!context) {
        const usedNumericProps = usedSymbols.reduce(
          (acc, symbol) => {
            acc[symbol] = data.cells.numericProps[symbol];
            return acc;
          },
          {} as Record<string, {value: VecExprVecLike}>
        );
        context = createEvaluationContext(
          usedNumericProps,
          rasterMetadata.nodata
        );
        dataWrapped = {
          ...dataWrapped,
          expressionEvalContext: context,
        };
      }

      if (!vecExprEvaluator || !expr) return dataWrapped;

      const evalResult = vecExprEvaluator(context);
      return {
        ...dataWrapped,
        customExpressionResults: {
          ...dataWrapped.customExpressionResults,
          [expr]: evalResult,
        },
      };
    }
  );
  return dataTransform;
}

function combineDataTransforms<T>(
  dataTransforms: (((data: T) => T) | undefined)[]
): ((data: T) => T) | undefined {
  const actualTransforms = dataTransforms.filter((v) => v) as ((
    data: T
  ) => T)[];

  if (actualTransforms.length === 0) return undefined;
  if (actualTransforms.length === 1) return actualTransforms[0];

  return (data: T) =>
    actualTransforms.reduce(
      (aggData, transformFun) => transformFun(aggData),
      data
    );
}

function createRgbToColorBufferDataTransform({
  bandDefs,
  attribute,
}: {
  bandDefs: Partial<Record<ColorBand, RasterLayerConfigColorBand>>;
  attribute: string;
}) {
  return createRasterColumnLayerDataTransform(
    (dataWrapped: RasterColumnLayerData) => {
      const length = dataWrapped.length;

      const getBandBufferOrValue = (colorBand?: RasterLayerConfigColorBand) => {
        if (colorBand?.type === 'expression') {
          return dataWrapped.customExpressionResults?.[colorBand.value];
        }
        if (colorBand?.type === 'band') {
          // we could use original band, but this one is already cleared from nodata if needed
          return dataWrapped.expressionEvalContext?.[colorBand.value];
        }
        return 0;
      };

      const red = getBandBufferOrValue(bandDefs.red);
      const green = getBandBufferOrValue(bandDefs.green);
      const blue = getBandBufferOrValue(bandDefs.blue);

      const colorBuffer = new Uint8Array(length * 4);
      for (
        let inputIndex = 0, outputIndex = 0;
        inputIndex < length;
        inputIndex++, outputIndex += 4
      ) {
        const redRaw =
          typeof red === 'number' ? red : red ? red[inputIndex] : NaN;
        const greenRaw =
          typeof green === 'number' ? green : green ? green[inputIndex] : NaN;
        const blueRaw =
          typeof blue === 'number' ? blue : blue ? blue[inputIndex] : NaN;

        if (isNaN(redRaw) && isNaN(greenRaw) && isNaN(blueRaw)) {
          // skip pixel
          bufferSetRgba(colorBuffer, outputIndex, 0, 0, 0, 0);
        } else {
          bufferSetRgba(
            colorBuffer,
            outputIndex,
            redRaw,
            greenRaw,
            blueRaw,
            255
          );
        }
      }

      // clear cached buffers
      // This transform is applied last -after expression & band evaluators which store and
      // cache values for _this_ transform.
      // Now,  _assuming_ this is last transform we can clear those buffers.
      dataWrapped.customExpressionResults = undefined;
      dataWrapped.expressionEvalContext = undefined;

      return {
        ...dataWrapped,
        attributes: {
          [attribute]: colorBuffer,
        },
      };
    }
  );
}

function getUsedSymbols(colorBands: RasterLayerConfigColorBand[]) {
  return Array.from(
    colorBands.reduce((symbols, band) => {
      if (band.type === 'expression') {
        const expressionSymbols =
          createVecExprEvaluator(band.value)?.symbols || [];
        expressionSymbols.forEach((symbol) => symbols.add(symbol));
      }
      if (band.type === 'band') {
        symbols.add(band.value);
      }
      return symbols;
    }, new Set<string>())
  );
}

export function getRasterTileLayerStylePropsRgb({
  layerConfig,
  rasterMetadata,
  visualChannels,
}: {
  layerConfig: MapLayerConfig;
  rasterMetadata: RasterMetadata;
  visualChannels: VisualChannels;
}) {
  const {visConfig} = layerConfig;
  const {colorBands} = visConfig;

  const bandDefs = {
    red: colorBands?.find((band) => band.band === 'red'),
    green: colorBands?.find((band) => band.band === 'green'),
    blue: colorBands?.find((band) => band.band === 'blue'),
  };

  const rgbToInstanceFillColorsDataTransform =
    createRgbToColorBufferDataTransform({
      bandDefs,
      attribute: 'instanceFillColors',
    });

  const usedSymbols = colorBands ? getUsedSymbols(colorBands) : [];
  const bandTransforms = RASTER_COLOR_BANDS.map((band) =>
    createExprDataTransform({
      colorBand: bandDefs[band],
      rasterMetadata,
      usedSymbols,
    })
  );
  const combinedDataTransform = combineDataTransforms([
    ...bandTransforms,
    rgbToInstanceFillColorsDataTransform,
  ]);

  return {
    dataTransform: combinedDataTransform as () => any,
    updateTriggers: getRasterTileLayerUpdateTriggers({
      layerConfig,
      visualChannels,
    }),
  };
}

function createBandColorScaleDataTransform({
  bandName,
  scaleFun,
  nodata,
  attribute,
}: {
  bandName: string;
  scaleFun: (v: number) => number[];
  nodata: number | string | undefined;
  attribute: string;
}) {
  const hasData = getHasDataPredicate(nodata);

  return createRasterColumnLayerDataTransform(
    (dataWrapped: RasterColumnLayerData) => {
      const length = dataWrapped.length;
      const bandBuffer = dataWrapped.data.cells.numericProps[bandName].value;
      const colorBuffer = new Uint8Array(length * 4);

      for (let i = 0; i < length; i++) {
        const rawValue = bandBuffer[i];
        if (!hasData(rawValue)) {
          // skip pixel
          bufferSetRgba(colorBuffer, i * 4, 0, 0, 0, 0);
        } else {
          const colorRgb = scaleFun(rawValue);
          bufferSetRgba(
            colorBuffer,
            i * 4,
            colorRgb[0],
            colorRgb[1],
            colorRgb[2],
            255
          );
        }
      }
      return {
        ...dataWrapped,
        attributes: {
          [attribute]: colorBuffer,
        },
      };
    }
  );
}

export function domainFromRasterMetadataBand(
  band: RasterMetadataBand,
  scaleType: ScaleType,
  colorRange: ColorRange
) {
  if (scaleType === 'ordinal') {
    return colorRange.colorMap?.map(([value]) => value) || [];
  }

  if (scaleType === 'quantile') {
    const scaleLength = colorRange.colors.length;
    const quantiles = band.stats.quantiles?.[scaleLength];
    if (!quantiles) {
      return [0, 1];
    }
    return [band.stats.min, ...quantiles, band.stats.max];
  }
  return [band.stats.min, band.stats.max];
}

/**
 * Get RasterLayerStyle props for ColorRange and UniqueValues modes
 *
 * Effectively, applies selected color scale applied to one band.
 */
export function getRasterTileLayerStylePropsScaledBand({
  layerConfig,
  rasterMetadata,
  visualChannels,
}: {
  layerConfig: MapLayerConfig;
  visualChannels: VisualChannels;
  rasterMetadata: RasterMetadata;
}) {
  const {visConfig} = layerConfig;
  const {colorField} = visualChannels;
  const {rasterStyleType} = visConfig;

  const colorRange =
    rasterStyleType === 'ColorRange'
      ? visConfig.colorRange
      : visConfig.uniqueValuesColorRange;
  const scaleType =
    rasterStyleType === 'ColorRange' ? visualChannels.colorScale : 'ordinal';
  const bandInfo = rasterMetadata.bands.find(
    (band) => band.name === colorField?.name
  );

  if (!colorField?.name || !scaleType || !colorRange || !bandInfo) {
    return {};
  }

  const domain = domainFromRasterMetadataBand(bandInfo, scaleType, colorRange);

  let scaleDomain = domain;
  if (scaleType === 'custom') {
    if (colorRange.uiCustomScaleType === 'logarithmic') {
      scaleDomain = getLog10ScaleSteps({
        min: bandInfo.stats.min,
        max: bandInfo.stats.max,
        steps: colorRange.colors.length,
      });
    } else {
      scaleDomain = colorRange.colorMap?.map(([value]) => value) || [];
    }
  }
  const scaleFun = createColorScale(
    scaleType,
    scaleDomain,
    colorRange.colors.map(hexToRGB),
    UNKNOWN_COLOR
  );

  const bandColorScaleDataTransform = createBandColorScaleDataTransform({
    bandName: bandInfo.name,
    scaleFun,
    nodata: bandInfo?.nodata ?? rasterMetadata.nodata,
    attribute: 'instanceFillColors',
  });

  return {
    dataTransform: bandColorScaleDataTransform as () => any,
    updateTriggers: getRasterTileLayerUpdateTriggers({
      layerConfig,
      visualChannels,
    }),
    domain: domain,
    scaleDomain: scaleFun.domain(),
    range: colorRange.colors,
    type: scaleType,
    field: colorField,
  };
}

export function getRasterTileLayerStyleProps({
  layerConfig,
  visualChannels,
  rasterMetadata,
}: {
  layerConfig: MapLayerConfig;
  visualChannels: VisualChannels;
  rasterMetadata: RasterMetadata;
}) {
  const {visConfig} = layerConfig;
  const {rasterStyleType} = visConfig;

  if (rasterStyleType === 'Rgb') {
    return getRasterTileLayerStylePropsRgb({
      layerConfig,
      rasterMetadata,
      visualChannels,
    });
  } else {
    return getRasterTileLayerStylePropsScaledBand({
      layerConfig,
      rasterMetadata,
      visualChannels,
    });
  }
}

export function getRasterTileLayerUpdateTriggers({
  layerConfig,
  visualChannels,
}: {
  layerConfig: MapLayerConfig;
  visualChannels: VisualChannels;
}) {
  const {visConfig} = layerConfig;
  const {rasterStyleType} = visConfig;
  const getFillColorUpdateTriggers: Record<string, unknown> = {
    rasterStyleType,
  };
  if (rasterStyleType === 'ColorRange') {
    getFillColorUpdateTriggers.colorRange = visConfig.colorRange?.colors;
    getFillColorUpdateTriggers.colorMap = visConfig.colorRange?.colorMap;
    getFillColorUpdateTriggers.colorScale = visualChannels.colorScale;
    getFillColorUpdateTriggers.colorFieldId = visualChannels.colorField?.name;
  } else if (rasterStyleType === 'UniqueValues') {
    getFillColorUpdateTriggers.colorMap =
      visConfig.uniqueValuesColorRange?.colorMap;
    getFillColorUpdateTriggers.colorFieldId = visualChannels.colorField?.name;
  } else if (rasterStyleType === 'Rgb') {
    getFillColorUpdateTriggers.colorBands = visConfig.colorBands;
  }

  return {
    getFillColor: getFillColorUpdateTriggers,
  };
}

function bufferSetRgba(
  target: VecExprVecLike,
  index: number,
  r: number,
  g: number,
  b: number,
  a: number
) {
  target[index + 0] = r;
  target[index + 1] = g;
  target[index + 2] = b;
  target[index + 3] = a;
}

function hexToRGB(hexColor: string): [number, number, number] {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  return [r, g, b];
}
