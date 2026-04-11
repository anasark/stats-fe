<template>
  <div v-if="!hasData" class="flex items-center justify-center h-40 text-gray-400 text-sm">
    No data available
  </div>
  <div v-else class="relative" :style="fill ? { height: '100%' } : { height: stacked && horizontal ? (labels.length * 52 + 60) + 'px' : stacked ? '350px' : 'auto' }">
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

  chart = new Chart(canvas.value, {
    type: "bar",
    data: {
      labels: props.labels,
      datasets: isStacked ? percentageDatasets.value : props.datasets,
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
          ticks: {
            font: { size: 10 },
            color: "#64748b",
            ...(isStacked && !isHorizontal
              ? { stepSize: 10, callback: (v) => `${v}%` }
              : {}),
          },
          ...(isStacked && !isHorizontal ? { min: 0, max: 100 } : {}),
        },
      },
    },
  });
}

onMounted(() => nextTick(init));
watch(
  () => [props.datasets, props.labels, props.stacked, props.horizontal],
  () => nextTick(init),
  { deep: true }
);
onBeforeUnmount(() => chart?.destroy());
</script>
