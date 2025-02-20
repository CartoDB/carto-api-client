import {Bench} from 'tinybench';
import {tileFeatures, TileFormat} from '@carto/api-client';
import {bbox} from '@turf/bbox';
import {buffer} from '@turf/buffer';
import {point} from '@turf/helpers';
import {randomPoint} from '@turf/random';
import {geojsonToBinary} from '@loaders.gl/gis';
import assert from 'node:assert';

/**
 * Benchmarks for local widget calculations.
 */

///////////////////////////////////////////////////////////////////////////////
// SETUP

const Fixtures = {};

async function setup() {
  const units = 'meters';

  Fixtures.CENTER = point([0, 0]);
  Fixtures.SPATIAL_FILTER = buffer(Fixtures.CENTER, 1_000, {units}).geometry;
  Fixtures.BBOX = bbox(buffer(Fixtures.CENTER, 2_000, {units}));
  Fixtures.POINTS_COUNT = 50_000;
  Fixtures.POINTS = randomPoint(Fixtures.POINTS_COUNT, {bbox: Fixtures.BBOX});

  const [west, south, east, north] = Fixtures.BBOX;

  Fixtures.POINTS_TILES = [
    {
      isVisible: true,
      data: geojsonToBinary(Fixtures.POINTS.features),
      bbox: {west, east, north, south},
    },
  ];
}

///////////////////////////////////////////////////////////////////////////////
// BENCHMARKS

// TODO: Add tileFeaturesSpatialIndex, tileFeaturesRaster
const tasks = [
  {
    title: 'tileFeaturesGeometries',
    fn: benchTileFeaturesGeometries,
  },
];

async function benchTileFeaturesGeometries() {
  const properties = tileFeatures({
    tiles: Fixtures.POINTS_TILES,
    tileFormat: TileFormat.BINARY,
    spatialDataType: 'geo',
    spatialFilter: Fixtures.SPATIAL_FILTER,
  });

  assert(properties.length > 0 && properties.length < Fixtures.POINTS_COUNT);
}

///////////////////////////////////////////////////////////////////////////////
// RUN

async function init() {
  const bench = new Bench({time: 1000});

  for (const {title, fn, options} of tasks) {
    bench.add(title, fn, options);
  }

  await bench.run();

  console.table(bench.table());
}

await setup();
await init();
