<template>
  <div class="relative">
    <!-- Filter dropdown -->
    <div v-if="platforms.length" class="absolute top-0 right-0 z-10">
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
    <div v-else>
      <!-- Custom legend -->
      <div class="flex flex-wrap justify-center gap-4 mb-2">
        <span
          v-for="item in customLegendItems"
          :key="item.label"
          class="flex items-center gap-1.5 text-[11px] text-slate-600 capitalize"
        >
          <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ backgroundColor: item.color }"></span>
          <PlatformIcon :platform="item.label" :size="13" />
          {{ item.label }}
        </span>
      </div>

      <div class="relative" style="height: 400px;">
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
  trendData: { type: Array, default: () => [] },
  table: { type: Array, default: () => [] },
});

const COLORS = ['#1a3a6b', '#7ab3e0', '#e05c5c', '#f0a500', '#5cb85c', '#9b59b6', '#17a2b8', '#6c757d'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const canvas = ref(null);
const dropdownOpen = ref(false);
const avgLabelTop = ref(100);
let chart = null;

const hasPlatformsInTrendData = computed(() => {
  return (props.trendData || []).some((row) => row.platform || row.source);
});

const sourceRows = computed(() => {
  if (Array.isArray(props.trendData) && props.trendData.length > 0 && hasPlatformsInTrendData.value) {
    return props.trendData;
  }
  if (Array.isArray(props.table) && props.table.length > 0) return props.table;
  if (Array.isArray(props.trendData) && props.trendData.length > 0) return props.trendData;
  return [];
});

const rawMonthlyRows = computed(() => {
  if (Array.isArray(props.trendData) && props.trendData.length > 0) return props.trendData;
  if (Array.isArray(props.table) && props.table.length > 0) return props.table;
  return [];
});

const aggregatedByMonth = computed(() => {
  const monthly = Array(12).fill(0);
  rawMonthlyRows.value.forEach(item => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;
    const monthIndex = date.getMonth();
    const total = Number(item.total ?? 1);
    monthly[monthIndex] += Number.isFinite(total) ? total : 0;
  });
  return monthly;
});

// Computed: unique platforms
const platforms = computed(() => {
  const platformSet = new Set();
  sourceRows.value.forEach((row) => {
    const name = row.platform || row.source;
    if (name) platformSet.add(name);
  });
  return Array.from(platformSet).sort();
});

// Platform colors mapping
const platformColors = computed(() => {
  const fixedColors = {
    Instagram: '#1a3a6b',
    'Online News': '#7ab3e0',
  };
  const colors = {};
  platforms.value.forEach((p, i) => {
    colors[p] = fixedColors[p] || COLORS[i % COLORS.length];
  });
  return colors;
});

// Track visible platforms
const visiblePlatforms = reactive(new Set());

const selectedCount = computed(() => visiblePlatforms.size);

// Whether we have data to display
const hasData = computed(() => sourceRows.value.length > 0);

const platformMonthlyTotals = computed(() => {
  const monthlyByPlatform = {};

  platforms.value.forEach((platform) => {
    monthlyByPlatform[platform] = Array(12).fill(0);
  });

  sourceRows.value.forEach((row) => {
    const date = new Date(row.date);
    if (Number.isNaN(date.getTime())) return;
    const monthIndex = date.getMonth();
    const platform = row.platform || row.source;
    if (!platform || !monthlyByPlatform[platform]) return;

    const total = Number(row.total ?? 1);
    monthlyByPlatform[platform][monthIndex] += Number.isFinite(total) ? total : 0;
  });

  return monthlyByPlatform;
});

const selectedMonthlyTotals = computed(() => {
  if (platforms.value.length === 0) {
    return aggregatedByMonth.value;
  }

  const monthly = Array(12).fill(0);

  platforms.value.forEach((platform) => {
    if (!visiblePlatforms.has(platform)) return;
    const values = platformMonthlyTotals.value[platform] || [];
    for (let i = 0; i < 12; i += 1) {
      monthly[i] += values[i] || 0;
    }
  });

  return monthly;
});

// Average mention across 12 monthly values
const avgMention = computed(() => {
  if (!hasData.value) return null;
  const total = selectedMonthlyTotals.value.reduce((sum, val) => sum + val, 0);
  return Math.round(total / 12);
});

// Build datasets: one line per platform
const chartDatasets = computed(() => {
  const datasets = [];

  if (platforms.value.length === 0) {
    datasets.push({
      label: 'Total Mention',
      data: aggregatedByMonth.value,
      borderColor: '#1a3a6b',
      backgroundColor: '#1a3a6b',
      tension: 0.3,
      borderWidth: 1.5,
      pointRadius: 2.5,
      pointBackgroundColor: '#1a3a6b',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      fill: false,
      hidden: false,
    });
  }

  platforms.value.forEach((platform) => {
    const data = platformMonthlyTotals.value[platform] || Array(12).fill(0);

    datasets.push({
      label: platform,
      data,
      borderColor: platformColors.value[platform],
      backgroundColor: platformColors.value[platform],
      tension: 0.3,
      borderWidth: 1.5,
      pointRadius: 2.5,
      pointBackgroundColor: platformColors.value[platform],
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      fill: false,
      hidden: !visiblePlatforms.has(platform),
    });
  });

  // Add average line as dashed dataset
  if (avgMention.value !== null) {
    datasets.push({
      label: 'Average',
      data: Array(12).fill(avgMention.value),
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

// Custom legend items: platforms only (no Average)
const customLegendItems = computed(() =>
  chartDatasets.value
    .filter((ds) => ds.label !== 'Average')
    .map((ds) => ({ label: ds.label, color: ds.borderColor })),
);

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
    const shouldHide = !visiblePlatforms.has(platform);
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

function init() {
  if (!canvas.value || !hasData.value) return;
  
  if (chart) chart.destroy();

  chart = new Chart(canvas.value, {
    type: "line",
    data: {
      labels: monthNames,
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
        legend: { display: false },
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
  () => [props.table, props.trendData],
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
