import React, {useEffect, useMemo, useState} from 'react';
import {Map} from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import {h3TableSource, Filters} from '@carto/api-client';
import {
  CategoryWidget,
  FormulaWidget,
  HistogramWidget,
  PieWidget,
  ScatterWidget,
  TableWidget,
} from '../components/index-react.js';
import {MapView} from '@deck.gl/core';
import {H3TileLayer} from '@deck.gl/carto';
import {FilterEvent} from '../components/types.js';

const MAP_VIEW = new MapView({repeat: true});
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  latitude: 37.3753636,
  longitude: -5.9962577,
  zoom: 6,
};

export function App(): JSX.Element {
  const [viewState, setViewState] = useState({...INITIAL_VIEW_STATE});
  const [filters, setFilters] = useState<Filters>({});
  const [attributionHTML, setAttributionHTML] = useState('');

  // Update sources.
  const data = useMemo(() => {
    return h3TableSource({
      accessToken: import.meta.env.VITE_CARTO_ACCESS_TOKEN,
      connectionName: 'carto_dw',
      tableName:
        'carto-demo-data.demo_tables.derived_spatialfeatures_esp_h3res8_v1_yearly_v2',
      filters,
      aggregationExp: 'sum(population) as population',
    });
  }, [filters]);

  // Update layers.
  const layers = useMemo(() => {
    return [
      new H3TileLayer({
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
        <h1>Spatial Index</h1>
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
          header="Total population"
          operation="count"
        ></FormulaWidget>

        <CategoryWidget
          data={data}
          viewState={viewState}
          header="Urbanity"
          operation="count"
          column="urbanity"
          onfilter={(e) => setFilters((e as FilterEvent).detail.filters)}
        ></CategoryWidget>
        <PieWidget
          data={data}
          viewState={viewState}
          header="Urbanity"
          operation="count"
          column="urbanity"
          onfilter={(e) => setFilters((e as FilterEvent).detail.filters)}
        ></PieWidget>
        <TableWidget
          data={data}
          viewState={viewState}
          header="Pop. Distribution"
          columns={['population', 'male', 'female']}
          sortBy="population"
        ></TableWidget>
        <ScatterWidget
          data={data}
          viewState={viewState}
          header="Education vs. Healthcare"
          xAxisColumn="education"
          yAxisColumn="healthcare"
        ></ScatterWidget>
        <HistogramWidget
          data={data}
          viewState={viewState}
          header="Population distribution"
          column="population"
          ticks={[100, 500, 1000, 5000]}
        ></HistogramWidget>
      </section>
      <footer
        id="footer"
        dangerouslySetInnerHTML={{__html: attributionHTML}}
      ></footer>
    </>
  );
}
