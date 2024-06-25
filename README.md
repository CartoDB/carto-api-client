# `@carto/api-client`

WORK IN PROGRESS.

## Installation

Install `@carto/api-client`:

```bash
npm install --save @carto/api-client
```

## Documentation

WORK IN PROGRESS.

### Fetching data

```javascript
import { vectorTableSource } from '@carto/api-client';

const data = vectorTableSource({
  accessToken: '••••',
  connectionName: 'carto_dw',
  tableName: 'carto-demo-data.demo_tables.retail_stores'
});

const { widgetSource } = await data;

// → {name: string; value: number}[]
const categories = await widgetSource.getCategories({
  column: 'store_type',
  operation: 'count',
});

// → {value: number}
const formula = await widgetSource.getFormula({operation: 'count'});

// → {totalCount: number; rows: Record<string, number | string>[]}
const table = await widgetSource.getTable({
  columns: ['a', 'b', 'c'],
  sortBy: ['a'],
  rowsPerPage: 20
});

...
```

### Column filter

To filter the widget source by a non-geospatial column, pass a `filters`
property to the source factory function.

```javascript
import { vectorTableSource } from '@carto/api-client';

const data = vectorTableSource({
  accessToken: '••••',
  connectionName: 'carto_dw',
  tableName: 'carto-demo-data.demo_tables.retail_stores',
  filters: {
    'store_type': {owner: 'widget-id', values: ['retail']}
  }
});
```

By default, filters affect all layers and widgets using a given data source. To
exclude a particular widget from the filter, pass a `filterOwner` parameter
matching the filters from which it should be excluded. In some cases, a widget's
results should not be affected by a filter that the widget itself created.

```javascript
// → {name: string; value: number}[]
const categories = await widgetSource.getCategories({
  filterOwner: 'widget-id',
  column: 'store_type',
  operation: 'count',
});
```

### Spatial filter

To filter the widget source by a geospatial column, including the map viewport,
pass a `spatialFilter` parameter (GeoJSON Polygon or MultiPolygon geometry) to any widget data fetching function.

```javascript
// → {name: string; value: number}[]
const categories = await widgetSource.getCategories({
  column: 'store_type',
  operation: 'count',
  spatialFilter: {
    type: "Polygon"
    coordinates: [
      [
        [-74.0562, 40.8331],
        [-74.0562, 40.6933],
        [-73.8734, 40.6933],
        [-73.8734, 40.8331],
        [-74.0562, 40.8331]
      ]
    ],
  }
});
```

## Versioning

Package versioning follows [Semantic Versioning 2.0.0](https://semver.org/).

## License

UNLICENSED. WORK IN PROGRESS.
