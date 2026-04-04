<template>
  <div ref="mapEl" class="w-full rounded-lg overflow-hidden" :style="{ height: height + 'px' }"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  provinces: {
    type: Array,
    default: () => [],
  },
  height: {
    type: Number,
    default: 320,
  },
});

// Approximate centre coordinates for Indonesian provinces
const PROVINCE_COORDS = {
  'aceh': [4.69, 96.75],
  'sumatera utara': [2.12, 99.53],
  'north sumatra': [2.12, 99.53],
  'sumatra utara': [2.12, 99.53],
  'sumatera barat': [-0.74, 100.24],
  'west sumatra': [-0.74, 100.24],
  'riau': [0.29, 101.70],
  'kepulauan riau': [3.64, 108.19],
  'riau islands': [3.64, 108.19],
  'jambi': [-1.61, 103.61],
  'sumatera selatan': [-3.32, 103.91],
  'south sumatra': [-3.32, 103.91],
  'bengkulu': [-3.52, 102.35],
  'lampung': [-4.56, 105.40],
  'bangka belitung': [-2.74, 106.44],
  'kepulauan bangka belitung': [-2.74, 106.44],
  'dki jakarta': [-6.21, 106.85],
  'jakarta': [-6.21, 106.85],
  'jawa barat': [-6.89, 107.65],
  'west java': [-6.89, 107.65],
  'banten': [-6.41, 106.02],
  'jawa tengah': [-7.15, 110.14],
  'central java': [-7.15, 110.14],
  'di yogyakarta': [-7.80, 110.40],
  'yogyakarta': [-7.80, 110.40],
  'jawa timur': [-7.55, 112.24],
  'east java': [-7.55, 112.24],
  'bali': [-8.41, 115.19],
  'nusa tenggara barat': [-8.65, 117.36],
  'ntb': [-8.65, 117.36],
  'west nusa tenggara': [-8.65, 117.36],
  'nusa tenggara timur': [-8.66, 121.08],
  'ntt': [-8.66, 121.08],
  'east nusa tenggara': [-8.66, 121.08],
  'kalimantan barat': [0.00, 109.34],
  'west kalimantan': [0.00, 109.34],
  'kalimantan tengah': [-1.68, 113.38],
  'central kalimantan': [-1.68, 113.38],
  'kalimantan selatan': [-3.09, 115.28],
  'south kalimantan': [-3.09, 115.28],
  'kalimantan timur': [1.23, 116.83],
  'east kalimantan': [1.23, 116.83],
  'kalimantan utara': [3.07, 116.04],
  'north kalimantan': [3.07, 116.04],
  'sulawesi utara': [1.49, 124.85],
  'north sulawesi': [1.49, 124.85],
  'gorontalo': [0.54, 123.06],
  'sulawesi tengah': [-1.43, 121.44],
  'central sulawesi': [-1.43, 121.44],
  'sulawesi barat': [-2.84, 119.23],
  'west sulawesi': [-2.84, 119.23],
  'sulawesi selatan': [-3.66, 119.97],
  'south sulawesi': [-3.66, 119.97],
  'sulawesi tenggara': [-4.14, 122.17],
  'southeast sulawesi': [-4.14, 122.17],
  'maluku': [-3.24, 130.14],
  'maluku utara': [1.57, 127.81],
  'north maluku': [1.57, 127.81],
  'papua barat': [-1.34, 133.17],
  'west papua': [-1.34, 133.17],
  'papua': [-4.27, 138.08],
  'papua selatan': [-7.00, 139.50],
  'papua tengah': [-3.50, 136.50],
  'papua pegunungan': [-4.00, 138.50],
};

function getCoords(name) {
  if (!name) return null;
  return PROVINCE_COORDS[name.toLowerCase().trim()] ?? null;
}

const mapEl = ref(null);
let map = null;
let markerLayer = null;

function buildMarkers() {
  if (!map) return;
  if (markerLayer) {
    markerLayer.clearLayers();
  } else {
    markerLayer = L.layerGroup().addTo(map);
  }

  const valid = props.provinces
    .map((p) => ({ ...p, coords: getCoords(p.province) }))
    .filter((p) => p.coords);

  if (!valid.length) return;

  const maxCount = Math.max(...valid.map((p) => p.count));

  valid.forEach((p) => {
    const radius = 8 + (p.count / maxCount) * 24;
    const circle = L.circleMarker(p.coords, {
      radius,
      fillColor: '#3b82f6',
      color: '#1d4ed8',
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.55,
    });
    circle.bindPopup(
      `<div style="font-size:12px;min-width:120px">
        <b>${p.province}</b><br/>
        <span style="color:#3b82f6">Mentions: <b>${p.count.toLocaleString()}</b></span>
      </div>`
    );
    circle.addTo(markerLayer);
  });

  const bounds = L.latLngBounds(valid.map((p) => p.coords));
  map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
}

onMounted(() => {
  map = L.map(mapEl.value, {
    center: [-2.5, 118],
    zoom: 4,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
  }).addTo(map);

  buildMarkers();
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

watch(() => props.provinces, buildMarkers, { deep: true });
</script>
