<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  horizontal: { type: Boolean, default: false },
  stacked: { type: Boolean, default: false },
});

const canvas = ref(null);
let chart = null;

function init() {
  if (chart) chart.destroy();
  chart = new Chart(canvas.value, {
    type: "bar",
    data: { labels: props.labels, datasets: props.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: props.horizontal ? "y" : "x",
      plugins: {
        legend: {
          position: "top",
          labels: { boxWidth: 10, font: { size: 10 } },
        },
      },
      scales: {
        x: { stacked: props.stacked, ticks: { font: { size: 9 } } },
        y: {
          stacked: props.stacked,
          beginAtZero: true,
          ticks: { font: { size: 9 } },
        },
      },
    },
  });
}

onMounted(init);
watch(() => props.datasets, init, { deep: true });
onBeforeUnmount(() => chart?.destroy());
</script>
