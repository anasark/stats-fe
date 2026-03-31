<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>{{ platformLabel }}</h3>
      <span class="badge">{{ formattedDate }}</span>
    </div>

    <div v-if="hasChartData" class="chart-wrapper">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div v-else class="raw-data">
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
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
  platform: { type: String, required: true },
  data: { type: [Array, Object], required: true },
  fetchedAt: { type: String, default: "" },
});

const canvasRef = ref(null);
let chartInstance = null;

const platformLabel = computed(() => {
  const map = { tiktok: "🎵 TikTok", facebook: "📘 Facebook" };
  return map[props.platform] || props.platform;
});

const formattedDate = computed(() => {
  if (!props.fetchedAt) return "";
  return new Date(props.fetchedAt).toLocaleString();
});

const chartItems = computed(() => {
  const raw = Array.isArray(props.data) ? props.data : [props.data];
  return raw.filter(
    (item) =>
      item &&
      (item.followersCount || item.fans || item.likes || item.followers),
  );
});

const hasChartData = computed(() => chartItems.value.length > 0);

onMounted(() => {
  if (!hasChartData.value || !canvasRef.value) return;

  const labels = chartItems.value.map(
    (item, i) => item.name || item.username || `Item ${i + 1}`,
  );
  const values = chartItems.value.map(
    (item) =>
      item.followersCount || item.fans || item.likes || item.followers || 0,
  );

  chartInstance = new Chart(canvasRef.value, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Followers / Fans",
          data: values,
          backgroundColor: "#4f46e5",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
});

onBeforeUnmount(() => {
  chartInstance?.destroy();
});
</script>

<style scoped>
.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.card-header h3 {
  margin: 0;
  font-size: 1rem;
}
.badge {
  font-size: 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}
.chart-wrapper {
  position: relative;
}
.raw-data {
  max-height: 300px;
  overflow: auto;
}
.raw-data pre {
  font-size: 0.75rem;
  color: #374151;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 4px;
  margin: 0;
}
</style>
