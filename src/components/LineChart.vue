<template>
  <div class="relative">
    <!-- Filter dropdown -->
    <div class="absolute top-0 right-0 z-10">
      <p class="text-[10px] text-slate-400 mb-1 text-right">*Select filter below</p>
      <div class="relative">
        <button
          @click="dropdownOpen = !dropdownOpen"
          class="bg-indigo-50 text-indigo-900 text-[11px] px-3 py-1.5 rounded flex items-center gap-2 min-w-[150px] justify-between border border-indigo-100"
        >
            <span>{{ selectedCount > 0 ? `${selectedCount} selected` : 'Multiple selections' }}</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          v-if="dropdownOpen"
          class="absolute right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg py-1 min-w-[150px] max-h-48 overflow-y-auto"
        >
          <label
            v-for="platform in platforms"
            :key="platform"
            class="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700"
          >
            <input
              type="checkbox"
              :checked="visiblePlatforms.has(platform)"
              @change="togglePlatform(platform)"
              class="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <PlatformIcon :platform="platform" :size="13" />
            {{ platform }}
          </label>
        </div>
      </div>
    </div>

    <!-- No data message -->
    <div v-if="!hasData" class="flex items-center justify-center h-[400px] text-slate-400 text-sm">
      No data available
    </div>

    <!-- Chart container -->
    <div v-else class="relative" style="height: 400px;">
      <canvas ref="canvas"></canvas>
      <!-- Average label -->
      <div
        v-if="avgMention !== null"
        class="absolute right-2 text-[11px] text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded"
        :style="{ top: avgLabelTop + 'px' }"
      >
        avg mention: {{ avgMention }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import PlatformIcon from "./PlatformIcon.vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const props = defineProps({
  table: { type: Array, default: () => [] },
});

const COLORS = ['#1a3a6b', '#7ab3e0', '#e05c5c', '#f0a500', '#5cb85c', '#9b59b6', '#17a2b8', '#6c757d'];

const canvas = ref(null);
const dropdownOpen = ref(false);
const avgLabelTop = ref(100);
let chart = null;

// Computed: unique sorted dates
const dates = computed(() => {
  const dateSet = new Set();
  props.table.forEach((row) => {
    if (row.date) dateSet.add(row.date);
  });
  return Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
});

// Computed: unique platforms
const platforms = computed(() => {
  const platformSet = new Set();
  props.table.forEach((row) => {
    if (row.platform) platformSet.add(row.platform);
  });
  return Array.from(platformSet).sort();
});

// Platform colors mapping
const platformColors = computed(() => {
  const colors = {};
  platforms.value.forEach((p, i) => {
    colors[p] = COLORS[i % COLORS.length];
  });
  return colors;
});

// Track visible platforms
const visiblePlatforms = reactive(new Set());

const selectedCount = computed(() => visiblePlatforms.size);

// Whether we have data to display
const hasData = computed(() => props.table.length > 0 && dates.value.length > 0);

// Average mention (total records / number of unique dates)
const avgMention = computed(() => {
  if (!hasData.value || dates.value.length === 0) return null;
  return Math.round(props.table.length / dates.value.length);
});

// Build datasets: one line per platform
const chartDatasets = computed(() => {
  const datasets = [];

  platforms.value.forEach((platform) => {
    const data = dates.value.map((date) => {
      return props.table.filter((row) => row.platform === platform && row.date === date).length;
    });

    datasets.push({
      label: platform,
      data,
      borderColor: platformColors.value[platform],
      backgroundColor: platformColors.value[platform],
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: platformColors.value[platform],
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      fill: false,
      hidden: visiblePlatforms.size > 0 && !visiblePlatforms.has(platform),
    });
  });

  // Add average line as dashed dataset
  if (avgMention.value !== null && dates.value.length > 0) {
    datasets.push({
      label: 'Average',
      data: Array(dates.value.length).fill(avgMention.value),
      borderColor: '#9ca3af',
      borderDash: [6, 4],
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      hidden: false,
    });
  }

  return datasets;
});

function togglePlatform(platform) {
  if (visiblePlatforms.has(platform)) {
    visiblePlatforms.delete(platform);
  } else {
    visiblePlatforms.add(platform);
  }
  updateChartVisibility();
}

function updateChartVisibility() {
  if (!chart) return;
  
  platforms.value.forEach((platform, index) => {
    const shouldHide = visiblePlatforms.size > 0 && !visiblePlatforms.has(platform);
    chart.setDatasetVisibility(index, !shouldHide);
  });
  
  chart.update();
}

function updateAvgLabelPosition() {
  if (!chart || avgMention.value === null) return;
  
  const yScale = chart.scales.y;
  if (yScale) {
    const pixelY = yScale.getPixelForValue(avgMention.value);
    avgLabelTop.value = pixelY - 10;
  }
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function init() {
  if (!canvas.value || !hasData.value) return;
  
  if (chart) chart.destroy();

  chart = new Chart(canvas.value, {
    type: "line",
    data: {
      labels: dates.value.map(formatDateLabel),
      datasets: chartDatasets.value,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        datalabels: { display: false },
        legend: {
          position: "top",
          align: "center",
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 20,
            font: { size: 11 },
            filter: (item) => item.text !== 'Average',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          titleColor: '#334155',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: '#f1f5f9',
            drawBorder: false,
          },
          ticks: {
            font: { size: 10 },
            color: '#64748b',
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Mention',
            font: { size: 11, weight: '500' },
            color: '#64748b',
          },
          grid: {
            color: '#f1f5f9',
            drawBorder: false,
          },
          ticks: {
            font: { size: 10 },
            color: '#64748b',
            precision: 0,
            stepSize: 1,
          },
        },
      },
      animation: {
        onComplete: updateAvgLabelPosition,
      },
    },
  });

  nextTick(updateAvgLabelPosition);
}

// Close dropdown when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.relative')) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  // Initialize all platforms as visible
  platforms.value.forEach((p) => visiblePlatforms.add(p));
  init();
  document.addEventListener('click', handleClickOutside);
});

watch(
  () => props.table,
  () => {
    visiblePlatforms.clear();
    platforms.value.forEach((p) => visiblePlatforms.add(p));
    nextTick(init);
  },
  { deep: true }
);

watch(
  () => platforms.value,
  (newPlatforms) => {
    newPlatforms.forEach((p) => {
      if (!visiblePlatforms.has(p)) {
        visiblePlatforms.add(p);
      }
    });
  },
);

onBeforeUnmount(() => {
  chart?.destroy();
  document.removeEventListener('click', handleClickOutside);
});
</script>
