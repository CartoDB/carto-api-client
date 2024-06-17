import React, {useEffect, useMemo, useState} from 'react';
import {Map} from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import {AggregationTypes, Filter, vectorTableSource} from '@carto/api-client';
import {
  CategoryWidget,
  FormulaWidget,
  HistogramWidget,
  PieWidget,
  ScatterWidget,
  TableWidget,
} from '../components/index-react.js';
import {MapView} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';

const MAP_VIEW = new MapView({repeat: true});
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_VIEW_STATE = {latitude: 40.7128, longitude: -74.006, zoom: 12};

export function App(): JSX.Element {
  const [viewState, setViewState] = useState({...INITIAL_VIEW_STATE});
  const [filters, setFilters] = useState<Record<string, Filter>>({});
  const [attributionHTML, setAttributionHTML] = useState('');

  // Update sources.
  const data = useMemo(() => {
    return vectorTableSource({
      accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
      connectionName: 'carto_dw',
      tableName: 'carto-demo-data.demo_tables.retail_stores',
      filters,
    });
  }, [filters]);

  // Update layers.
  const layers = useMemo(() => {
    return [
      new VectorTileLayer({
        id: 'retail_stores',
        data,
        pointRadiusMinPixels: 4,
        getFillColor: [200, 0, 80],
      }),
    ];
  }, [data]);

  useEffect(() => {
    data?.then(({attribution}) => setAttributionHTML(attribution));
  }, [data]);

  return (
    <>
      <header>
        <h1>React</h1>
        <a href="../">← Back</a>
      </header>
      <section id="view">
        <DeckGL
          layers={layers}
          views={MAP_VIEW}
          initialViewState={INITIAL_VIEW_STATE}
          controller={{dragRotate: false}}
          onViewStateChange={({viewState}) => setViewState(viewState)}
        >
          <Map reuseMaps mapStyle={MAP_STYLE} />
        </DeckGL>
      </section>
      <section id="rail">
        <FormulaWidget
          data={data}
          viewState={viewState}
          header="Total"
          operation={AggregationTypes.COUNT}
        ></FormulaWidget>

        <CategoryWidget
          data={data}
          viewState={viewState}
          header="Store type"
          operation={AggregationTypes.COUNT}
          column="storetype"
          onfilter={(e) => setFilters((e as any).detail.filters)} // TODO: types
        ></CategoryWidget>

        <PieWidget
          data={data}
          viewState={viewState}
          header="Store type"
          operation={AggregationTypes.COUNT}
          column="storetype"
          onfilter={(e) => setFilters((e as any).detail.filters)} // TODO: types
        ></PieWidget>

        <TableWidget
          data={data}
          viewState={viewState}
          header="Store type"
          columns={['storetype', 'revenue']}
        ></TableWidget>

        <ScatterWidget
          data={data}
          viewState={viewState}
          header="Size vs. Revenue"
          xAxisColumn="size_m2"
          yAxisColumn="revenue"
        ></ScatterWidget>

        <HistogramWidget
          data={data}
          viewState={viewState}
          header="Revenue"
          column="revenue"
          ticks={[1250000, 1500000, 1750000]}
        ></HistogramWidget>
      </section>
      <footer
        id="footer"
        dangerouslySetInnerHTML={{__html: attributionHTML}}
      ></footer>
    </>
  );
}
