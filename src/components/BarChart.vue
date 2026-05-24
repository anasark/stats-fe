<template>
  <div v-if="!hasData" class="flex items-center justify-center h-40 text-gray-400 text-sm">
    No data available
  </div>
  <div v-else class="relative" :style="fill ? { height: '100%' } : { height: stacked && horizontal ? (labels.length * 40 + 60) + 'px' : stacked ? '350px' : 'auto' }">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartDataLabels,
);

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  horizontal: { type: Boolean, default: false },
  stacked: { type: Boolean, default: false },
  fill: { type: Boolean, default: false },
});

// Platform icon map (mirrors PlatformIcon.vue)
const PLATFORM_ICON_MAP = {
  facebook:      { icon: 'ri:facebook-fill',  color: '#1877F2' },
  instagram:     { icon: 'ri:instagram-fill',  color: '#E1306C' },
  tiktok:        { icon: 'ri:tiktok-fill',     color: '#010101' },
  twitter:       { icon: 'ri:twitter-x-fill',  color: '#000000' },
  x:             { icon: 'ri:twitter-x-fill',  color: '#000000' },
  youtube:       { icon: 'ri:youtube-fill',    color: '#FF0000' },
  linkedin:      { icon: 'ri:linkedin-fill',   color: '#0A66C2' },
  threads:       { icon: 'ri:threads-fill',    color: '#101010' },
  reddit:        { icon: 'ri:reddit-fill',     color: '#FF4500' },
  news:          { icon: 'ri:global-line',     color: '#3949AB' },
  'online news': { icon: 'ri:global-line',     color: '#3949AB' },
};

// Preloaded icon images keyed by normalised label
const iconImages = {};

function getIconifyUrl(iconId, color, size = 14) {
  const [collection, name] = iconId.split(':');
  return `https://api.iconify.design/${collection}/${name}.svg?color=${encodeURIComponent(color)}&width=${size}&height=${size}`;
}

function loadPlatformIcons() {
  if (!props.horizontal) return;
  props.labels.forEach((label) => {
    const key = label.toLowerCase().trim();
    if (iconImages[key]?.complete) return;
    const cfg = PLATFORM_ICON_MAP[key];
    if (!cfg) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { iconImages[key] = img; chart?.update('none'); };
    img.onerror = () => {};
    img.src = getIconifyUrl(cfg.icon, cfg.color, 14);
  });
}

// Custom plugin: draw icon + text for each y-axis tick
const customYLabelPlugin = {
  id: 'customYLabelPlugin',
  afterDraw(chartInstance) {
    if (!props.horizontal) return;
    const { ctx, scales } = chartInstance;
    const yScale = scales.y;
    if (!yScale) return;

    const iconSize = 14;
    const gap = 4;
    const rightPad = 8;

    ctx.save();
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    yScale.ticks.forEach((tick, i) => {
      const label = props.labels[tick.value] ?? String(tick.value ?? '');
      const y = yScale.getPixelForTick(i);
      const rightX = yScale.right - rightPad;

      ctx.fillText(label, rightX, y);

      const key = label.toLowerCase().trim();
      const img = iconImages[key];
      if (img?.complete && img.naturalWidth > 0) {
        const textWidth = ctx.measureText(label).width;
        const iconX = rightX - textWidth - gap - iconSize;
        if (iconX >= yScale.left) {
          ctx.drawImage(img, iconX, y - iconSize / 2, iconSize, iconSize);
        }
      }
    });

    ctx.restore();
  },
};

const canvas = ref(null);
let chart = null;

const hasData = computed(() => props.labels.length > 0 && props.datasets.length > 0);

// Convert raw counts to percentages for 100% stacked chart
const percentageDatasets = computed(() => {
  if (!props.stacked || !hasData.value) return props.datasets;

  // Calculate totals for each label index
  const totals = props.labels.map((_, idx) => {
    return props.datasets.reduce((sum, ds) => sum + (ds.data[idx] || 0), 0);
  });

  // Convert each dataset to percentages
  return props.datasets.map((ds) => ({
    ...ds,
    data: ds.data.map((val, idx) => {
      const total = totals[idx];
      return total > 0 ? Math.round((val / total) * 100) : 0;
    }),
  }));
});

function init() {
  if (!canvas.value || !hasData.value) return;
  if (chart) chart.destroy();

  const isStacked = props.stacked;
  const isHorizontal = props.horizontal;
  const useIconLabels = isHorizontal;

  chart = new Chart(canvas.value, {
    type: "bar",
    plugins: useIconLabels ? [customYLabelPlugin] : [],
    data: {
      labels: props.labels,
      datasets: (isStacked ? percentageDatasets.value : props.datasets).map((ds) => ({
        ...ds,
        ...(isHorizontal ? { barThickness: 28 } : {}),
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: !isStacked && !props.fill,
      indexAxis: isHorizontal ? "y" : "x",
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "center",
          labels: {
            usePointStyle: true,
            pointStyle: "rect",
            boxWidth: 12,
            boxHeight: 12,
            padding: 20,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.dataset.label || "";
              const value = ctx.parsed[isHorizontal ? "x" : "y"];
              return isStacked ? `${label}: ${value}%` : `${label}: ${value}`;
            },
          },
        },
        datalabels: isStacked
          ? {
              color: "#ffffff",
              font: { size: 13, weight: "bold" },
              anchor: "center",
              align: "center",
              formatter: (value) => (value >= 5 ? `${value}%` : ""),
              display: (ctx) => ctx.dataset.data[ctx.dataIndex] >= 5,
            }
          : { display: false },
      },
      scales: {
        x: {
          stacked: isStacked,
          grid: {
            display: isStacked && !isHorizontal,
            color: "#f1f5f9",
            drawBorder: false,
          },
          ticks: {
            font: { size: 10 },
            color: "#64748b",
          },
          ...(isStacked && isHorizontal
            ? { min: 0, max: 100, ticks: { stepSize: 10, callback: (v) => `${v}%` } }
            : {}),
        },
        y: {
          stacked: isStacked,
          beginAtZero: true,
          grid: {
            display: isStacked && !isHorizontal,
            color: "#f1f5f9",
            drawBorder: false,
          },
          afterFit: useIconLabels
            ? (scale) => { scale.width = Math.max(scale.width, 100); }
            : undefined,
          ticks: {
            font: { size: 10 },
            color: "#64748b",
            // Hide native labels when using custom icon labels
            ...(useIconLabels ? { callback: () => '' } : {}),
            ...(isStacked && !isHorizontal
              ? { stepSize: 10, callback: (v) => `${v}%` }
              : {}),
          },
          ...(isStacked && !isHorizontal ? { min: 0, max: 100 } : {}),
        },
      },
    },
  });

  if (useIconLabels) loadPlatformIcons();
}

onMounted(() => nextTick(init));
watch(
  () => [props.datasets, props.labels, props.stacked, props.horizontal],
  () => nextTick(init),
  { deep: true }
);
onBeforeUnmount(() => chart?.destroy());
</script>
