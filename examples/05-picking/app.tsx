import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Map} from 'react-map-gl/maplibre';
import DeckGL, {DeckGLRef} from '@deck.gl/react';
import {PickObjectsResponse, vectorTableSource} from '@carto/api-client';
import {FormulaWidget} from '../components/index-react.js';
import {MapView} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';

const MAP_VIEW = new MapView({repeat: true});
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_VIEW_STATE = {latitude: 40.7128, longitude: -74.006, zoom: 12};

const POINT_RADIUS = 20;

export function App(): JSX.Element {
  const deckRef = useRef<DeckGLRef<MapView>>(null);
  const [viewState, setViewState] = useState({...INITIAL_VIEW_STATE});
  const [attributionHTML, setAttributionHTML] = useState('');
  const [featureIds, setFeatureIds] = useState<number[]>([]);
  const [response, setResponse] = useState<PickObjectsResponse | null>(null);

  // Update sources.
  const data = useMemo(() => {
    return vectorTableSource({
      accessToken: import.meta.env.VITE_CARTO_DED14_ACCESS_TOKEN,
      apiBaseUrl: 'https://gcp-us-east1-14.dev.api.carto.com',
      connectionName: 'bigquery-dev',
      tableName: 'carto-demo-data.demo_tables.retail_stores',
      columns: ['_carto_feature_id'],
    });
  }, []);

  // Update layers.
  const layers = useMemo(() => {
    return [
      new VectorTileLayer({
        id: 'retail_stores',
        data,
        pointRadiusMinPixels: POINT_RADIUS,
        getFillColor: [200, 0, 80],
        pickable: true,
      }),
    ];
  }, [data]);

  useEffect(() => {
    data?.then(({attribution}) => setAttributionHTML(attribution));
  }, [data]);

  useEffect(() => {
    if (!featureIds.length) {
      setResponse({rows: []});
      return;
    }
    data?.then(({widgetSource}) => {
      widgetSource
        .getFeatures({
          featureIds,
          dataType: 'points',
          columns: ['storetype', 'address', 'revenue'],
          z: viewState.zoom,
        })
        .then(setResponse);
    });
  }, [featureIds]);

  const onPick = useCallback(() => {}, []);

  return (
    <>
      <header>
        <h1>Picking</h1>
        <a href="../">← Back</a>
      </header>
      <section id="view">
        <DeckGL
          layers={layers}
          views={MAP_VIEW}
          initialViewState={INITIAL_VIEW_STATE}
          controller={{dragRotate: false}}
          onViewStateChange={({viewState}) => setViewState(viewState)}
          ref={deckRef}
          onClick={({x, y}) => {
            const hits = deckRef.current!.pickMultipleObjects({
              x,
              y,
              depth: 10,
              radius: POINT_RADIUS,
              layerIds: ['retail_stores'],
            });
            const ids = Array.from(
              new Set(
                hits.map((info) => info.object.properties['_carto_feature_id'])
              )
            );
            console.log({hits: hits.length, ids: ids.length});
            setFeatureIds(ids);
          }}
        >
          <Map reuseMaps mapStyle={MAP_STYLE} />
        </DeckGL>
      </section>
      <section id="rail">
        <FormulaWidget
          data={data}
          viewState={viewState}
          header="Total"
          operation="count"
        ></FormulaWidget>
        <div className="debug">
          <h3>Feature IDs</h3>
          <pre>
            <code>{featureIds ? JSON.stringify(featureIds, null, 2) : ''}</code>
          </pre>
        </div>
        <div className="debug">
          <h3>Response</h3>
          <pre>
            <code>{response ? JSON.stringify(response, null, 2) : ''}</code>
          </pre>
        </div>
      </section>
      <footer
        id="footer"
        dangerouslySetInnerHTML={{__html: attributionHTML}}
      ></footer>
    </>
  );
}
