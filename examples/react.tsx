import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import {
  CategoryWidgetComponent,
  FormulaWidgetComponent,
  PieWidgetComponent,
  AggregationTypes,
  ScatterWidgetComponent,
  TableWidgetComponent,
  Filter,
  vectorTableSource,
} from '../';
import {MapView} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';

const MAP_VIEW = new MapView({repeat: true});
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_VIEW_STATE = {latitude: 40.7128, longitude: -74.006, zoom: 12};

function App(): JSX.Element {
  const [viewState, setViewState] = useState({...INITIAL_VIEW_STATE});
  const [filters, setFilters] = useState<Record<string, Filter>>({});

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

  return (
    <>
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
        <FormulaWidgetComponent
          data={data}
          viewState={viewState}
          header="Total"
          operation={AggregationTypes.COUNT}
        ></FormulaWidgetComponent>

        <CategoryWidgetComponent
          data={data}
          viewState={viewState}
          header="Store type"
          operation={AggregationTypes.COUNT}
          column="storetype"
          onfilter={(e) => setFilters((e as any).detail.filters)} // TODO: types
        ></CategoryWidgetComponent>

        <PieWidgetComponent
          data={data}
          viewState={viewState}
          header="Store type"
          operation={AggregationTypes.COUNT}
          column="storetype"
          onfilter={(e) => setFilters((e as any).detail.filters)} // TODO: types
        ></PieWidgetComponent>

        <TableWidgetComponent
          data={data}
          viewState={viewState}
          header="Store type"
          columns={['storetype', 'revenue']}
        ></TableWidgetComponent>

        <ScatterWidgetComponent
          data={data}
          viewState={viewState}
          header="Size vs. Revenue"
          xAxisColumn="size_m2"
          yAxisColumn="revenue"
        ></ScatterWidgetComponent>
      </section>
      <footer id="footer"></footer>
    </>
  );
}

const container = document.querySelector('#app')!;
createRoot(container).render(<App />);
