<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
});

const canvas = ref(null);
let chart = null;

function init() {
  if (chart) chart.destroy();
  chart = new Chart(canvas.value, {
    type: "line",
    data: { labels: props.labels, datasets: props.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      tension: 0.4,
      plugins: {
        legend: {
          position: "top",
          labels: { boxWidth: 10, font: { size: 10 } },
        },
      },
      scales: {
        x: { ticks: { font: { size: 9 } } },
        y: { beginAtZero: true, ticks: { font: { size: 9 } } },
      },
    },
  });
}

onMounted(init);
watch(() => props.datasets, init, { deep: true });
onBeforeUnmount(() => chart?.destroy());
</script>
