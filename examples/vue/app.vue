<script setup lang="ts">
import '@carto/ui';
import {Filter, FilterEvent, vectorTableSource} from '@carto/core';
import {Map} from 'maplibre-gl';
import {Deck, MapViewState} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watchEffect,
} from 'vue';

const ACCESS_TOKEN = import.meta.env.VITE_CARTO_ACCESS_TOKEN;
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_MAP_STATE: MapViewState = {
  latitude: 40.7128,
  longitude: -74.006,
  zoom: 12,
};

const map = shallowRef<Map | null>(null);
const deck = shallowRef<Deck | null>(null);
const viewState = ref<MapViewState>(INITIAL_MAP_STATE);
const filters = ref<Record<string, Filter>>({});
const attributionHTML = ref<string>('');

const data = computed(() =>
  vectorTableSource({
    accessToken: ACCESS_TOKEN,
    connectionName: 'carto_dw',
    tableName: 'carto-demo-data.demo_tables.retail_stores',
    filters: filters.value,
  })
);

const layer = computed(
  () =>
    new VectorTileLayer({
      id: 'retail_stores',
      data: data.value,
      pointRadiusMinPixels: 4,
      getFillColor: [200, 0, 80],
    })
);

watchEffect(() => {
  const {longitude, latitude, ...rest} = viewState.value;
  map.value?.jumpTo({center: [longitude, latitude], ...rest});
});

watchEffect(() => {
  deck.value?.setProps({layers: layer.value ? [layer.value] : []});
});

watchEffect(() => {
  data.value?.then(({attribution}) => (attributionHTML.value = attribution));
});

function onFilterChange(event: FilterEvent) {
  filters.value = event.detail.filters;
}

onMounted(() => {
  map.value = new Map({
    container: 'map',
    style: MAP_STYLE,
    interactive: false,
  });

  deck.value = new Deck({
    canvas: 'deck-canvas',
    initialViewState: INITIAL_MAP_STATE,
    controller: true,
    layers: [],
    onViewStateChange: ({viewState: _viewState}) => {
      viewState.value = _viewState;
    },
  });
});

onUnmounted(() => {
  deck.value?.finalize();
  map.value?.remove();
});
</script>

<template>
  <header>
    <h1>Vue</h1>
    <a href="../">← Back</a>
  </header>
  <section id="view">
    <div id="map"></div>
    <canvas id="deck-canvas"></canvas>
  </section>
  <section id="rail">
    <formula-widget
      header="Total"
      operation="count"
      :data="data"
      :viewState="viewState"
    ></formula-widget>

    <category-widget
      header="Store type"
      operation="count"
      column="storetype"
      :data="data"
      :viewState="viewState"
      @filter="onFilterChange"
    ></category-widget>

    <pie-widget
      header="Store type"
      operation="count"
      column="storetype"
      :data="data"
      :viewState="viewState"
      @filter="onFilterChange"
    ></pie-widget>

    <table-widget
      header="Store type"
      :columns="['storetype', 'revenue']"
      :data="data"
      :viewState="viewState"
    ></table-widget>

    <scatter-widget
      header="Size vs. Revenue"
      xAxisColumn="size_m2"
      yAxisColumn="revenue"
      :data="data"
      :viewState="viewState"
    ></scatter-widget>
  </section>
  <footer id="footer" v-html="attributionHTML"></footer>
</template>

<style scoped></style>
