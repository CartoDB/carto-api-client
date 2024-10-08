<script lang="ts">
  import '../components/index.js';
  import type {Filter, VectorTableSourceResponse} from '@carto/api-client';
  import {vectorTableSource} from '@carto/api-client';
  import {Map} from 'maplibre-gl';
  import type {MapViewState} from '@deck.gl/core';
  import {Deck} from '@deck.gl/core';
  import {VectorTileLayer} from '@deck.gl/carto';
  import {onDestroy, onMount} from 'svelte';
  import type {FilterEvent} from '../components/index.js';

  const ACCESS_TOKEN = import.meta.env.VITE_CARTO_ACCESS_TOKEN;
  const MAP_STYLE =
    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
  const INITIAL_MAP_STATE: MapViewState = {
    latitude: 40.7128,
    longitude: -74.006,
    zoom: 12,
  };

  let map: Map;
  let deck: Deck;

  let mapEl: HTMLDivElement;
  let canvasEl: HTMLCanvasElement;

  let viewState = INITIAL_MAP_STATE;
  let filters: Record<string, Filter> = {};
  let attributionHTML: string;

  let data: Promise<VectorTableSourceResponse>;
  $: data = vectorTableSource({
    accessToken: ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName: 'carto-demo-data.demo_tables.retail_stores',
    filters: filters,
  });

  let layer: VectorTileLayer;
  $: layer = new VectorTileLayer({
    id: 'retail_stores',
    data: data,
    pointRadiusMinPixels: 4,
    getFillColor: [200, 0, 80],
  });

  $: {
    const {longitude, latitude, ...rest} = viewState;
    map?.jumpTo({center: [longitude, latitude], ...rest});
  }

  $: deck?.setProps({layers: [layer]});
  $: data?.then(({attribution}) => (attributionHTML = attribution));

  function onFilterChange(event: FilterEvent) {
    filters = event.detail.filters;
  }

  onMount(() => {
    map = new Map({
      container: mapEl,
      style: MAP_STYLE,
      interactive: false,
    });

    deck = new Deck({
      canvas: canvasEl,
      initialViewState: INITIAL_MAP_STATE,
      controller: true,
      layers: [],
      onViewStateChange: ({viewState: _viewState}) => (viewState = _viewState),
    });
  });

  onDestroy(() => {
    deck?.finalize();
    map?.remove();
  });
</script>

<header>
  <h1>Svelte</h1>
  <a href="../">← Back</a>
</header>
<section id="view">
  <div id="map" bind:this={mapEl}></div>
  <canvas id="deck-canvas" bind:this={canvasEl}></canvas>
</section>
<section id="rail">
  <formula-widget header="Total" operation="count" {data} {viewState}
  ></formula-widget>

  <category-widget
    header="Store type"
    operation="count"
    column="storetype"
    {data}
    {viewState}
    on:filter={onFilterChange}
  ></category-widget>

  <pie-widget
    header="Store type"
    operation="count"
    column="storetype"
    {data}
    {viewState}
    on:filter={onFilterChange}
  ></pie-widget>

  <table-widget
    header="Store type"
    columns={['storetype', 'revenue']}
    {data}
    {viewState}
  ></table-widget>

  <scatter-widget
    header="Size vs. Revenue"
    xAxisColumn="size_m2"
    yAxisColumn="revenue"
    {data}
    {viewState}
  ></scatter-widget>

  <histogram-widget
    data={data}
    viewState={viewState}
    header="Revenue"
    column="revenue"
    ticks={[1250000, 1500000, 1750000]}
  ></histogram-widget>
</section>
<footer id="footer">{@html attributionHTML}</footer>

<style></style>
