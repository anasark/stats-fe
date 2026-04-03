<template>
  <div>
    <!-- Legend -->
    <div class="flex items-center justify-center gap-6 mb-4">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#3B4FA8]"></span>
        <span class="text-xs text-slate-600">Positive</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#D1D5DB]"></span>
        <span class="text-xs text-slate-600">Neutral</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#F87171]"></span>
        <span class="text-xs text-slate-600">Negative</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!hasData" class="text-center text-gray-400 py-8">
      No data available
    </div>

    <!-- Platform rows -->
    <div v-else class="space-y-4">
      <div
        v-for="item in processedData"
        :key="item.platform"
        class="flex items-center gap-3"
      >
        <!-- Platform label -->
        <div class="flex items-center gap-2 w-[140px] shrink-0">
          <img
            :src="getPlatformIcon(item.platform)"
            width="32"
            height="32"
            :alt="item.platform"
            class="shrink-0"
            @error="handleIconError"
          />
          <span class="text-sm text-slate-700 truncate">{{ item.platform }}</span>
        </div>

        <!-- Stacked bar -->
        <div class="flex flex-1 h-10 rounded overflow-hidden">
          <!-- Positive segment -->
          <div
            v-if="item.positivePct > 0"
            class="flex items-center justify-center transition-all duration-300"
            :style="{
              width: item.positivePct + '%',
              backgroundColor: '#3B4FA8',
              minWidth: item.positivePct > 0 ? '1px' : '0',
            }"
          >
            <span
              v-if="item.positivePct >= 10"
              class="text-white font-bold text-sm"
            >
              {{ Math.round(item.positivePct) }}%
            </span>
          </div>

          <!-- Neutral segment -->
          <div
            v-if="item.neutralPct > 0"
            class="flex items-center justify-center transition-all duration-300"
            :style="{
              width: item.neutralPct + '%',
              backgroundColor: '#D1D5DB',
              minWidth: item.neutralPct > 0 ? '1px' : '0',
            }"
          >
            <span
              v-if="item.neutralPct >= 10"
              class="text-gray-700 font-bold text-sm"
            >
              {{ Math.round(item.neutralPct) }}%
            </span>
          </div>

          <!-- Negative segment -->
          <div
            v-if="item.negativePct > 0"
            class="flex items-center justify-center transition-all duration-300"
            :style="{
              width: item.negativePct + '%',
              backgroundColor: '#F87171',
              minWidth: item.negativePct > 0 ? '1px' : '0',
            }"
          >
            <span
              v-if="item.negativePct >= 10"
              class="text-white font-bold text-sm"
            >
              {{ Math.round(item.negativePct) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  data: { type: Array, default: () => [] },
  table: { type: Array, default: () => [] },
});

// Derive platform sentiment from table records when API data is unavailable
const derivedFromTable = computed(() => {
  if (!props.table.length) return [];
  const map = {};
  for (const row of props.table) {
    const p = row.platform;
    if (!p) continue;
    if (!map[p]) map[p] = { platform: p, positive: 0, neutral: 0, negative: 0 };
    const s = row.sentiment;
    if (s === 'positive') map[p].positive++;
    else if (s === 'neutral') map[p].neutral++;
    else if (s === 'negative') map[p].negative++;
  }
  return Object.values(map);
});

// Use API data if available, otherwise fall back to table-derived data
const sourceData = computed(() => {
  const hasApiData = props.data.length > 0 && props.data.some((item) => (item.total ?? 0) > 0);
  return hasApiData ? props.data : derivedFromTable.value;
});

const hasData = computed(() => sourceData.value.length > 0);

const processedData = computed(() => {
  return sourceData.value.map((item) => {
    const total = item.total ?? (item.positive + item.neutral + item.negative);
    return {
      platform: item.platform,
      positivePct: total > 0 ? (item.positive / total) * 100 : 0,
      neutralPct: total > 0 ? (item.neutral / total) * 100 : 0,
      negativePct: total > 0 ? (item.negative / total) * 100 : 0,
    };
  });
});

function getPlatformIcon(platform) {
  const iconMap = {
    Facebook: "https://cdn.simpleicons.org/facebook/1877F2",
    Instagram: "https://cdn.simpleicons.org/instagram/E1306C",
    TikTok: "https://cdn.simpleicons.org/tiktok/000000",
    "X (Twitter)": "https://cdn.simpleicons.org/x/000000",
    Twitter: "https://cdn.simpleicons.org/x/000000",
    "Online News": "https://cdn.simpleicons.org/googlenews/4285F4",
    YouTube: "https://cdn.simpleicons.org/youtube/FF0000",
  };

  return iconMap[platform] || "https://cdn.simpleicons.org/internetexplorer/0076D6";
}

function handleIconError(e) {
  e.target.style.display = "none";
}
</script>
