# CHANGELOG

## Unreleased

## 0.5

### 0.5.24

- fix(fetchMap): Don't fetch fonts when invoked outside browser (#264)

### 0.5.23

- fix(fetchMap): Add tag-mapId to requests (#255)
- chore(fetch-map): expose fillInMapDatasets and fillInTileStats as private (#254)

### 0.5.22

- fix(parseMap): Fix scale info for custom & logarithmic scales (#251)

### 0.5.21

- fix(query,fetchMap): Fix queryParameter encoding for POST requests. (#247)

### 0.5.20

- fix(fetchMap): support quantile color scale with 2 ranges (#241)

### 0.5.19

- fix(fetchMap): support point radius aggregation (#242)
- fix(sources): export CARTO_SOURCES (#243)

### 0.5.18

- fix(fetchMap): getColorAccessor treats colorMap as override of actual domain (#238)

### 0.5.17

- feat(fetchMap): Raster layers, update triggers and other fixes (#223)

### 0.5.16

- feat(widgets): Add getAggregations() method (#229)
- chore(deps): bump h3-js from 4.2.1 to 4.3.0 (#232)

### 0.5.15

- feat(sources): Add support for trajectory data sources (#227, #228)

### 0.5.14

- feat(widgets): Add 'getExtent()' method, experimental (#220)

### 0.5.13

- fix(constants): Export RasterBandColorinterp (#216)

### 0.5.12

- feat(sources): allow passing tags to baseSource and query methods (#193)

### 0.5.11

### 0.5.10

- fix(widgets): orderBy support in WidgetRasterSource.getCategory (#210)

### 0.5.9

- feat(widgets): orderBy support in WidgetSource.getCategory (#203)

## 0.5.8

- feat(widgets): Add othersThreshold to WidgetSource.getCategories (#194)
- perf(rasters): Improve performance of raster widget spatial filtering (#207)

### 0.5.7

- feat(widgets): Allow local widget calculations without spatial filter (#204)
- perf(widgets): Improve performance of local widget spatial filtering (#192, #201)

### 0.5.6

- chore(widgets): Add AggregationTypes enum-like definition (#187)
- feat(worker): Distribute worker script as standalone JS bundle (#189)
- feat(widgets): Add widgetWorkerUrl option (#188)
- feat(widgets): WidgetRemoteSource: custom aggregations for category, timeseries models (#174)

### 0.5.5

- feat(fetchmap): Expose legend info from fetchMap (#179)
- fix(widgets): Fix inference of 'spatialDataColumn' in some table and query widgets (#183)

### 0.5.4

- fix(widgets): Fix support for 'storeGeometry' on tileset widgets (#181)
- fix(widgets): Fix inference of 'spatialDataType' for dynamic point aggregation sources (#178)

### 0.5.3

- chore(deps): Unpin h3-js dependency (#176)
- chore(types): Export missing types used in public API (#159)

### 0.5.2

- feat(filters): Export getApplicableFilters (#162)
- fix(fetchmap): Bug fixes (#161, #163)
- fix(widgets): Fix error computing min/max for large datasets (#164)
- chore(build): Improve package compatibility (#158, #160)

### 0.5.1

- chore(types): Cleanup for tilesets, rasters, and backward-compatibility (#150)
- feat(fetchMap): Export legendSettings (#153)

### 0.5.0

- BREAKING CHANGE: Replace 'abortController' with 'signal' parameter (#110)
- feat: Add widget calculations for tileset sources (#50)
- feat: Add widget calculations for raster sources (#119)
- feat: Enable Web Workers for local tileset and raster widget calculations (#119)

## 0.4

### 0.4.10

- feat: Add fetchMap() (#126, #132, #133, #135, #136, #137, #138, #139)
- chore(widgets,deps): Clean up dataResolution references, examples, deps (#134)

### 0.4.9

- feat: Remove spatialIndexReferenceViewState param (#128)

### 0.4.8

- fix: Fix clientId defaults in query and source calls (#122)

### 0.4.7

- fix: Fix clientId customization in table and query widget calls (#120)
- feat: Add getDataFilterExtensionProps (#105, #113)
- feat: Add option to override HTTP headers in widget calls (#100, #111)
- feat: Add filters parameter in widget calls (#103)
- chore: Update to turf.js v7.2 (#98)
- chore: Enable compatibility with moduleResolution=nodenext (#106)

### 0.4.6

- chore: Add repository and homepage in npm package metadata

### 0.4.5

- types: Export TileResolution and SpatialFilterPolyfillMode types (#63)
- fix: Propagate spatialDataColumn and tileResolution defaults to widget source (#64)

### 0.4.4

- feat: Add support for spatial index types (H3, quadbin) in Widget APIs

### 0.4.3

- feat: Add support for`aggregationExp` parameter to `vectorQuerySource` and `vectorTableSource`

### 0.4.2

- fix: Fix incorrect column name lowercasing in Picking Model API

### 0.4.1

- feat: Add cache control mechanism for sources and query APIs

### 0.4.0

- feat: Add Picking Model API
- refactor: Migrate sources from `@deck.gl/carto` to `@carto/api-client`
- deps: Remove `@deck.gl/carto` bundled dependency

## 0.3

### 0.3.0

- deps: Add `@deck.gl/carto` as dependency

## 0.2

### 0.2.0

- feat: Initial release
