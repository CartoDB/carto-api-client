import {describe, test, expect} from 'vitest';
import {BASEMAP, _MapLibreBasemap as MapLibreBasemap} from '@deck.gl/carto';
import {withMockFetchMapsV3} from '../__mock-fetch.js';
import {fetchBasemapProps} from '@deck.gl/carto';

const mockedMapConfig = {
  mapState: {
    latitude: 33.3232,
    longitude: -122.0312,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  },
  mapStyle: {
    styleType: 'positron',
    visibleLayerGroups: {},
  },
  visState: {
    layers: [],
  },
  layerBlending: undefined,
  interactionConfig: undefined,
} as any;

const mockedCartoStyle = {
  id: '1234',
  layers: [
    {id: 'background'},
    {id: 'label'},
    {id: 'road'},
    {id: 'boundaries'},
    {id: 'water'},
  ],
};

async function responseFunc(url: string) {
  if (url === BASEMAP.VOYAGER) {
    return await Promise.resolve({
      json: async () => await Promise.resolve(mockedCartoStyle),
    });
  } else if (url === BASEMAP.DARK_MATTER) {
    throw new Error('connection error');
  } else {
    return await Promise.resolve({
      ok: false,
      json: async () => await Promise.reject(new Error('fake error')),
    });
  }
}

describe('fetchBasemapProps', () => {
  test('carto - no filters', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async (_calls) => {
      calls = _calls;
      expect(calls.length).toBe(0);

      const r = await fetchBasemapProps({config: mockedMapConfig});
      expect(calls.length).toBe(0);
      expect(r).toEqual({
        type: 'maplibre',
        props: {
          style: BASEMAP.POSITRON,
          center: [-122.0312, 33.3232],
          zoom: 5,
          pitch: 0,
          bearing: 0,
        },
        visibleLayerGroups: {},
        rawStyle: BASEMAP.POSITRON,
      });
    }, responseFunc);
  });

  test('carto - with filters', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async (_calls) => {
      calls = _calls;
      const visibleLayerGroups = {
        label: false,
        road: true,
        border: true,
        water: true,
      };
      const r = await fetchBasemapProps({
        config: {
          ...mockedMapConfig,
          mapStyle: {
            styleType: 'voyager',
            visibleLayerGroups,
          },
        },
      });

      expect(calls.length).toBe(1);
      expect(calls[0].url).toBe(BASEMAP.VOYAGER);
      expect(r.type).toBe('maplibre');

      const r2 = r as MapLibreBasemap;
      expect(r2.rawStyle).toBe(mockedCartoStyle);
      expect(r2.props.style).toEqual({
        ...mockedCartoStyle,
        layers: mockedCartoStyle.layers.filter((l) => l.id !== 'label'),
      });
      expect(r2.visibleLayerGroups).toEqual(visibleLayerGroups);
    }, responseFunc);
  });

  test('custom basemap', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async (_calls) => {
      calls = _calls;
      const r = await fetchBasemapProps({
        config: {
          ...mockedMapConfig,
          mapStyle: {
            styleType: 'custom:uuid1234',
          },
          customBaseMaps: {
            customStyle: {
              id: 'custom:uuid1234',
              style: 'http://example.com/style.json',
              customAttribution: 'custom attribution',
            },
          },
        },
      });

      expect(calls.length).toBe(0);
      expect(r).toEqual({
        type: 'maplibre',
        props: {
          style: 'http://example.com/style.json',
          center: [-122.0312, 33.3232],
          zoom: 5,
          pitch: 0,
          bearing: 0,
        },
        attribution: 'custom attribution',
      });
    }, responseFunc);
  });

  test('google maps', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async (_calls) => {
      calls = _calls;
      const r = await fetchBasemapProps({
        config: {
          ...mockedMapConfig,
          mapStyle: {
            styleType: 'google-voyager',
          },
        },
      });

      expect(calls.length).toBe(0);
      expect(r).toEqual({
        type: 'google-maps',
        props: {
          mapTypeId: 'roadmap',
          mapId: '885caf1e15bb9ef2',
          center: {
            lat: 33.3232,
            lng: -122.0312,
          },
          zoom: 6,
          tilt: 0,
          heading: 0,
        },
      });
    }, responseFunc);
  });

  test('error handling', async () => {
    let calls: any[] = [];
    await withMockFetchMapsV3(async (_calls) => {
      calls = _calls;
      const expectedError = await fetchBasemapProps({
        config: {
          ...mockedMapConfig,
          mapStyle: {
            styleType: 'dark-matter',
            visibleLayerGroups: {
              label: false,
              road: true,
              border: true,
              water: true,
            },
          },
        },
      }).catch((error) => error);

      expect(calls.length).toBe(1);
      expect(calls[0].url).toBe(BASEMAP.DARK_MATTER);
      expect(expectedError.message).toBe(`Basemap style API request failed
Failed to connect connection error
`);
      expect(expectedError.errorContext.requestType).toBe('Basemap style');
    }, responseFunc);
  });
});
