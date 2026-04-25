<template>
  <div class="min-h-screen bg-slate-100 font-sans">
    <!-- HEADER -->
    <header
      class="bg-gradient-to-r from-[#1a237e] to-[#283593] text-white shadow-lg"
    >
      <div class="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-4">
          <img
            :src="logo"
            class="h-10 object-contain"
            alt="Logo"
            @error="(e) => (e.target.style.display = 'none')"
          />
          <div>
            <h1 class="text-base font-extrabold tracking-widest">
              MEDIA MONITORING DASHBOARD
            </h1>
            <p class="text-xs text-blue-200 mt-0.5">
              {{
                activeTab === "overview"
                  ? "Overview Media Sentiment"
                  : "Detail Media Sentiment"
              }}
            </p>
          </div>
        </div>

        <!-- FILTERS -->
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <p class="text-[10px] text-blue-300 mb-1">Date</p>
            <div class="flex gap-1">
              <input
                type="date"
                v-model="filters.start_date"
                class="bg-white/10 border border-white/25 rounded px-2 py-1 text-[11px] text-white w-32"
              />
              <input
                type="date"
                v-model="filters.end_date"
                class="bg-white/10 border border-white/25 rounded px-2 py-1 text-[11px] text-white w-32"
              />
            </div>
          </div>
          <div>
            <p class="text-[10px] text-blue-300 mb-1">Keyword</p>
            <input
              type="text"
              v-model="filters.keyword"
              placeholder="Search…"
              class="bg-white/10 border border-white/25 rounded px-2 py-1 text-[11px] text-white w-32 placeholder-blue-300"
            />
          </div>
          <div>
            <p class="text-[10px] text-blue-300 mb-1">Platform</p>
            <select
              v-model="filters.platform"
              class="bg-white/10 border border-white/25 rounded px-2 py-1 text-[11px] text-white w-32"
            >
              <option value="" class="text-slate-800">All Platform</option>
              <option
                v-for="p in dashboardData.filters.platforms"
                :key="p"
                :value="p"
                class="text-slate-800"
              >
                {{ p }}
              </option>
            </select>
          </div>
          <div>
            <p class="text-[10px] text-blue-300 mb-1">Region</p>
            <select
              v-model="filters.region"
              class="bg-white/10 border border-white/25 rounded px-2 py-1 text-[11px] text-white w-32"
            >
              <option value="" class="text-slate-800">All Region</option>
              <option
                v-for="r in dashboardData.filters.regions"
                :key="r"
                :value="r"
                class="text-slate-800"
              >
                {{ r }}
              </option>
            </select>
          </div>
          <button
            @click="applyFilters"
            class="bg-white text-[#1a237e] text-[11px] font-bold px-3 h-7 rounded hover:bg-blue-50 transition border border-transparent"
          >
            Apply
          </button>
          <button
            @click="resetFilters"
            class="bg-white/10 text-white text-[11px] px-3 h-7 rounded hover:bg-white/20 transition border border-white/20"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-6 pb-0 flex gap-1 border-t border-white/10">
        <button
          @click="activeTab = 'overview'"
          :class="
            activeTab === 'overview'
              ? 'bg-white text-[#1a237e] font-bold'
              : 'text-blue-200 hover:text-white'
          "
          class="text-xs px-4 py-2 rounded-t-lg transition-all"
        >
          Overview
        </button>
        <button
          @click="activeTab = 'detail'"
          :class="
            activeTab === 'detail'
              ? 'bg-white text-[#1a237e] font-bold'
              : 'text-blue-200 hover:text-white'
          "
          class="text-xs px-4 py-2 rounded-t-lg transition-all"
        >
          Detail
        </button>
        <button
          @click="logout"
          class="ml-auto text-xs text-blue-300 hover:text-white px-4 py-2"
        >
          Logout
        </button>
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div
        class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <div v-else class="p-5">
      <!-- Active filter badge -->
      <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 mb-4">
        <span
          class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium"
        >
          🔍 Showing filtered results ({{ tableMeta.total }} rows)
        </span>
        <span
          v-if="filters.start_date || filters.end_date"
          class="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full"
        >
          📅 {{ filters.start_date || "…" }} → {{ filters.end_date || "…" }}
        </span>
        <span
          v-if="filters.keyword"
          class="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full"
        >
          🔤 "{{ filters.keyword }}"
        </span>
        <span
          v-if="filters.platform"
          class="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full"
        >
          📡 {{ filters.platform }}
        </span>
        <span
          v-if="filters.region"
          class="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full"
        >
          📍 {{ filters.region }}
        </span>
      </div>

      <!-- ===================== OVERVIEW ===================== -->
      <div v-if="activeTab === 'overview'">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
          <!-- Net Sentiment -->
          <div ref="netSentimentCardRef" class="bg-white rounded-xl shadow p-4 flex flex-col">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0"
            >
              Net Sentiment
            </p>
            <div class="flex-1 flex flex-col items-center justify-center">
              <div class="relative w-full h-[140px] overflow-hidden px-4">
                <svg viewBox="0 0 120 60" class="w-full h-full">
                  <path
                    d="M10,60 A50,50 0 0,1 110,60"
                    fill="none"
                    stroke="#e2e8f0"
                    stroke-width="10"
                    stroke-linecap="round"
                  />
                  <path
                    d="M10,60 A50,50 0 0,1 110,60"
                    fill="none"
                    :stroke="gaugeColor"
                    stroke-width="10"
                    stroke-linecap="round"
                    stroke-dasharray="157"
                    :stroke-dashoffset="gaugeDashOffset"
                  />
                  <line
                    x1="60" y1="60"
                    :x2="gaugeNeedle.x2" :y2="gaugeNeedle.y2"
                    :stroke="gaugeColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  />
                  <circle cx="60" cy="60" r="4" fill="#334155" />
                </svg>
                <div class="absolute inset-x-0 bottom-0 text-center">
                  <span class="text-4xl font-bold text-slate-700"
                    >{{ dashboardData.net_sentiment }}</span
                  >
                </div>
              </div>
              <p class="text-[11px] text-slate-400 mt-3">← Free Period: +38%</p>
            </div>
          </div>

          <!-- Sentiment % -->
          <div ref="sentimentPctCardRef" class="bg-white rounded-xl shadow p-4 flex flex-col">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0"
            >
              Sentiment Percentage
            </p>
            <div class="flex-1 flex justify-around items-center">
              <div class="text-center">
                <div
                  class="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center"
                >
                  <img :src="satisfiedIcon" class="w-16 h-16" alt="Satisfied" />
                </div>
                <p class="text-xs text-slate-500 mt-4">Satisfied</p>
                <p class="text-xl font-bold mt-1" style="color:#1e40af">
                  {{ dashboardData.sentiment_percentage.positive }}%
                </p>
              </div>
              <div class="text-center">
                <div
                  class="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center"
                >
                  <img :src="neutralIcon" class="w-16 h-16" alt="Neutral" />
                </div>
                <p class="text-xs text-slate-500 mt-4">Neutral</p>
                <p class="text-xl font-bold text-yellow-500 mt-1">
                  {{ dashboardData.sentiment_percentage.neutral }}%
                </p>
              </div>
              <div class="text-center">
                <div
                  class="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center"
                >
                  <img :src="unsatisfiedIcon" class="w-16 h-16" alt="Unsatisfied" />
                </div>
                <p class="text-xs text-slate-500 mt-4">Unsatisfied</p>
                <p class="text-xl font-bold text-red-500 mt-1">
                  {{ dashboardData.sentiment_percentage.negative }}%
                </p>
              </div>
            </div>
          </div>

          <!-- Negative Word Cloud -->
          <div class="bg-white rounded-xl shadow p-3 flex flex-col" style="min-height:220px">
            <p
              class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0"
            >
              Negative Word Cloud
            </p>
            <div class="flex-1 min-h-0">
              <WordCloud :words="dashboardData.negative_words" color="red" class="w-full h-full" />
            </div>
          </div>

          <!-- Positive Word Cloud -->
          <div class="bg-white rounded-xl shadow p-3 flex flex-col" style="min-height:220px">
            <p
              class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0"
            >
              Positive Word Cloud
            </p>
            <div class="flex-1 min-h-0">
              <WordCloud :words="dashboardData.positive_words" color="blue" class="w-full h-full" />
            </div>
          </div>

          <div class="bg-white rounded-xl shadow p-4 lg:col-span-2 flex flex-col">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2"
            >
              Trend
            </p>
            <div v-if="dashboardData.mention_by_platform.length" class="flex flex-wrap gap-3 mb-3">
              <span
                v-for="p in dashboardData.mention_by_platform"
                :key="p.platform"
                class="flex items-center gap-1.5 text-[11px] text-slate-600 capitalize"
              >
                <PlatformIcon :platform="p.platform" :size="14" />
                {{ p.platform }}
              </span>
            </div>
            <LineChart :table="dashboardData.table" />
          </div>
          <div class="bg-white rounded-xl shadow p-4 lg:col-span-2 flex flex-col">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2"
            >
              Sentiment by Platform
            </p>
            <div v-if="dashboardData.platform_sentiment.length" class="flex flex-wrap gap-4 mb-3">
              <span
                v-for="p in dashboardData.platform_sentiment"
                :key="p.platform"
                class="flex items-center gap-1.5 text-[11px] text-slate-600 capitalize"
              >
                <PlatformIcon :platform="p.platform" :size="14" />
                {{ p.platform }}
              </span>
            </div>
            <div class="flex-1 min-h-0">
              <BarChart
                :labels="sentimentPlatformLabels"
                :datasets="sentimentPlatformDatasets"
                :stacked="true"
                :horizontal="true"
                :fill="true"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== DETAIL ===================== -->
      <div v-else class="space-y-5">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <!-- Mention by Platform -->
          <div ref="platformCardRef" class="bg-white rounded-xl shadow p-4 flex flex-col">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3"
            >
              # Mention by Platform
            </p>
            <div class="space-y-3">
              <div
                v-for="item in mentionByPlatformWithPct"
                :key="item.platform"
                class="flex items-center gap-3"
              >
                <span class="shrink-0 w-7 flex items-center justify-center">
                  <PlatformIcon :platform="item.platform" :size="20" />
                </span>
                <span class="text-[11px] text-slate-600 w-24 shrink-0 capitalize">{{
                  item.platform
                }}</span>
                <div class="flex-1 bg-slate-100 rounded h-7 overflow-hidden">
                  <div
                    class="h-full bg-[#3949ab] rounded flex items-center gap-2 px-2.5 transition-all duration-500"
                    :style="{ width: item.pct + '%' }"
                  >
                    <span class="text-[11px] text-white font-bold whitespace-nowrap">{{ item.count }}</span>
                    <span class="text-[11px] text-blue-200 whitespace-nowrap">{{ item.pct }}%</span>
                  </div>
                </div>
              </div>
              <p
                v-if="!dashboardData.mention_by_platform.length"
                class="text-xs text-slate-400 text-center py-4"
              >
                No data
              </p>
            </div>
          </div>

          <!-- Engagement (2 cols) -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow p-4 flex flex-col" :style="platformCardHeight ? { height: platformCardHeight + 'px' } : {}">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 shrink-0"
            >
              Engagement
            </p>
            <div v-if="dashboardData.engagement.length" class="overflow-x-auto flex-1">
              <table class="w-full text-xs text-left">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="pb-2 pr-3 text-slate-400 font-semibold">Platform</th>
                    <th class="pb-2 pr-3 text-slate-400 font-semibold text-right">Post</th>
                    <th class="pb-2 pr-3 text-slate-400 font-semibold text-right">Like</th>
                    <th class="pb-2 pr-3 text-slate-400 font-semibold text-right">Comment</th>
                    <th class="pb-2 text-slate-400 font-semibold text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in dashboardData.engagement"
                    :key="row.platform"
                    class="border-b border-slate-100"
                  >
                    <td class="py-1.5 pr-3 font-medium text-slate-700">
                      <span class="inline-flex items-center gap-1.5">
                        <PlatformIcon :platform="row.platform" :size="14" />
                        {{ row.platform }}
                      </span>
                    </td>
                    <td class="py-1.5 pr-3 text-right text-slate-600">{{ (row.total ?? 0).toLocaleString() }}</td>
                    <td class="py-1.5 pr-3 text-right text-slate-600">{{ (row.likes ?? 0).toLocaleString() }}</td>
                    <td class="py-1.5 pr-3 text-right text-slate-600">{{ (row.comments ?? 0).toLocaleString() }}</td>
                    <td class="py-1.5 text-right text-slate-600">{{ (row.shares ?? 0).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-xs text-slate-400 text-center py-6">No engagement data</p>
          </div>

          <!-- Top Topic -->
          <div class="bg-white rounded-xl shadow p-4 flex flex-col" :style="platformCardHeight ? { height: platformCardHeight + 'px' } : {}">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 shrink-0"
            >
              Top Topic
            </p>
            <ol class="space-y-2 overflow-y-auto flex-1">
              <li
                v-for="(topic, i) in dashboardData.top_topics"
                :key="topic.topic ?? topic"
                class="flex items-center gap-2 text-sm text-slate-700"
              >
                <span
                  class="w-5 h-5 rounded-full bg-[#1a237e] text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                  >{{ i + 1 }}</span
                >
                {{ topic.topic ?? topic }}
              </li>
            </ol>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Mention by Province -->
          <div class="bg-white rounded-xl shadow p-4">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3"
            >
              # Mention by Province
            </p>
            <div v-if="dashboardData.mention_by_province.length">
              <BarChart
                :labels="provinceLabels"
                :datasets="provinceDatasets"
                :horizontal="true"
              />
            </div>
            <p v-else class="text-xs text-slate-400 text-center py-6">
              No province data
            </p>
          </div>

          <!-- Geomap -->
          <div class="bg-white rounded-xl shadow p-4">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3"
            >
              Geomap
            </p>
            <GeoMap
              :provinces="dashboardData.mention_by_province"
            />
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <p
              class="text-[11px] font-bold text-slate-500 uppercase tracking-widest"
            >
              # Mention Data List
            </p>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] text-slate-400">Rows per page:</span>
                <select
                  v-model.number="filters.per_page"
                  @change="filters.page = 1"
                  class="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
              <span class="text-[11px] text-slate-400">{{ tableMeta.total }} records</span>
            </div>
          </div>
          <div v-if="dashboardData.table.length" key="data-table">
            <div class="overflow-auto" style="max-height: calc(100vh - 260px);">
            <table class="w-full text-xs text-left">
              <thead class="sticky top-0 z-10">
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('date')"
                  >
                    Date
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('platform')"
                  >
                    Platform
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'platform' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('region')"
                  >
                    Region
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'region' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                  <th class="px-3 py-2 text-slate-500 font-semibold">
                    Content
                  </th>
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold text-right whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('likes')"
                  >
                    Like
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'likes' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold text-right whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('comments')"
                  >
                    Comment
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'comments' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold text-right whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('shares')"
                  >
                    Share
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'shares' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-slate-500 font-semibold whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    @click="toggleSort('sentiment')"
                  >
                    Sentiment
                    <span class="ml-0.5 text-[10px]">{{ sortKey === 'sentiment' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in pagedTable"
                  :key="row.id ?? i"
                  class="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td class="px-3 py-2 text-slate-500 whitespace-nowrap">
                    {{ row.date }}
                  </td>
                  <td class="px-3 py-2 text-slate-700 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1.5">
                      <PlatformIcon :platform="row.platform" :size="13" />
                      {{ row.platform }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-slate-600 whitespace-nowrap">
                    {{ row.region }}
                  </td>
                  <td class="px-3 py-2 text-slate-700 max-w-xs truncate">
                    {{ row.text }}
                  </td>
                  <td class="px-3 py-2 text-right text-slate-600">
                    {{ (row.likes ?? 0).toLocaleString() }}
                  </td>
                  <td class="px-3 py-2 text-right text-slate-600">
                    {{ (row.comments ?? 0).toLocaleString() }}
                  </td>
                  <td class="px-3 py-2 text-right text-slate-600">
                    {{ (row.shares ?? 0).toLocaleString() }}
                  </td>
                  <td class="px-3 py-2">
                    <span
                      :class="{
                        'bg-blue-100 text-blue-700':
                          row.sentiment === 'positive',
                        'bg-red-100 text-red-700': row.sentiment === 'negative',
                        'bg-yellow-100 text-yellow-700':
                          row.sentiment === 'neutral',
                      }"
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize whitespace-nowrap"
                    >
                      {{ row.sentiment }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
            <!-- Pagination -->
            <div class="flex items-center justify-between mt-3 px-1">
              <span class="text-[11px] text-slate-400">
                Page {{ tableMeta.page }} of {{ tableMeta.pages }}
                &nbsp;·&nbsp; {{ tableMeta.total }} total
              </span>
              <div class="flex gap-2">
                <button
                  @click="filters.page--"
                  :disabled="tableMeta.page <= 1"
                  class="text-[11px] px-3 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <button
                  @click="filters.page++"
                  :disabled="tableMeta.page >= tableMeta.pages"
                  class="text-[11px] px-3 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-slate-400 text-center py-8">
            No results found. Try adjusting filters.
          </p>
        </div>
      </div>
    </div>

    <footer class="text-center text-[11px] text-slate-400 py-4">
      © 2026 CTX CORP. All Rights Reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import LineChart from "../components/LineChart.vue";
import BarChart from "../components/BarChart.vue";
import GeoMap from "../components/GeoMap.vue";
import PlatformIcon from "../components/PlatformIcon.vue";
import WordCloud from "../components/WordCloud.vue";
import defaultLogo from "../assets/logo.svg";

const userLogos = import.meta.glob("../assets/usres/*.{jpg,jpeg,png,svg}", { eager: true });
const _authName = localStorage.getItem("username") || "";
const _extensions = ["svg", "png", "jpg", "jpeg"];
const logo = (() => {
  for (const ext of _extensions) {
    const key = `../assets/usres/${_authName}.${ext}`;
    if (userLogos[key]) return userLogos[key].default ?? userLogos[key];
  }
  return defaultLogo;
})();
import satisfiedIcon from "../assets/icons/satisfied.svg";
import neutralIcon from "../assets/icons/neutral.svg";
import unsatisfiedIcon from "../assets/icons/unsatisfied.svg";

const router = useRouter();
const loading = ref(true);
const activeTab = ref("overview");
const platformCardRef = ref(null);
const platformCardHeight = ref(null);
const netSentimentCardRef = ref(null);
const sentimentPctCardRef = ref(null);
const overviewRowHeight = ref(null);

const dashboardData = reactive({
  filters: { platforms: [], regions: [], applied: {} },
  net_sentiment: 0,
  sentiment_percentage: { positive: 0, neutral: 0, negative: 0 },
  trend: [],
  platform_sentiment: [],
  mention_by_platform: [],
  mention_by_province: [],
  mention_by_media: [],
  top_topics: [],
  engagement: [],
  negative_words: [],
  positive_words: [],
  table: [],
});

const filters = reactive({
  start_date: "",
  end_date: "",
  keyword: "",
  platform: "",
  region: "",
  page: 1,
  per_page: 20,
});

// Sorting
const sortKey = ref('');
const sortDir = ref('asc');

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  filters.page = 1;
}

const sortedTable = computed(() => {
  if (!sortKey.value) return dashboardData.table;
  return [...dashboardData.table].sort((a, b) => {
    let va = a[sortKey.value] ?? '';
    let vb = b[sortKey.value] ?? '';
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir.value === 'asc' ? va - vb : vb - va;
    }
    va = String(va).toLowerCase();
    vb = String(vb).toLowerCase();
    if (va < vb) return sortDir.value === 'asc' ? -1 : 1;
    if (va > vb) return sortDir.value === 'asc' ? 1 : -1;
    return 0;
  });
});

// Client-side pagination over the full table returned by the API
const pagedTable = computed(() => {
  const start = (filters.page - 1) * filters.per_page;
  return sortedTable.value.slice(start, start + filters.per_page);
});

const tableMeta = computed(() => {
  const total = sortedTable.value.length;
  const pages = Math.max(1, Math.ceil(total / filters.per_page));
  return { total, page: filters.page, per_page: filters.per_page, pages };
});

const hasActiveFilters = computed(
  () =>
    filters.start_date ||
    filters.end_date ||
    filters.keyword ||
    filters.platform ||
    filters.region,
);

async function loadDashboard() {
  try {
    loading.value = true;
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined),
    );
    const res = await api.get("/dashboard", { params });
    const d = res.data;
    dashboardData.filters              = d.filters             ?? { platforms: [], regions: [], applied: {} };
    dashboardData.net_sentiment        = d.net_sentiment        ?? 0;
    dashboardData.sentiment_percentage = d.sentiment_percentage ?? { positive: 0, neutral: 0, negative: 0 };
    dashboardData.trend                = Array.isArray(d.trend)                ? d.trend                : [];
    dashboardData.platform_sentiment   = Array.isArray(d.platform_sentiment)   ? d.platform_sentiment   : [];
    dashboardData.mention_by_platform  = Array.isArray(d.mention_by_platform)  ? d.mention_by_platform  : [];
    dashboardData.mention_by_province  = Array.isArray(d.mention_by_province)  ? d.mention_by_province  : [];
    dashboardData.mention_by_media     = Array.isArray(d.mention_by_media)     ? d.mention_by_media     : [];
    dashboardData.top_topics           = Array.isArray(d.top_topics)           ? d.top_topics           : [];
    dashboardData.engagement           = Array.isArray(d.engagement)           ? d.engagement           : [];
    dashboardData.negative_words       = Array.isArray(d.negative_words)       ? d.negative_words       : [];
    dashboardData.positive_words       = Array.isArray(d.positive_words)       ? d.positive_words       : [];
    dashboardData.table                = Array.isArray(d.table)                ? d.table                : [];
    filters.page                       = 1;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  filters.page = 1;
  loadDashboard();
}

function resetFilters() {
  filters.start_date = "";
  filters.end_date   = "";
  filters.keyword    = "";
  filters.platform   = "";
  filters.region     = "";
  filters.page       = 1;
  loadDashboard();
}

async function logout() {
  await api.post("/logout").catch(() => {});
  localStorage.removeItem("token");
  router.push("/login");
}

function platformIcon(p) {
  const map = {
    TikTok: "🎵",
    Facebook: "📘",
    Instagram: "📸",
    "X (Twitter)": "𝕏",
    "Online News": "🌐",
  };
  return map[p] || "📡";
}

// Word cloud: scale font-size 12–36px proportionally by count
function wordSize(words, count) {
  if (!words || words.length === 0) return 16;
  const counts = words.map((w) => w.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  if (min === max) return 24;
  return Math.round(12 + ((count - min) / (max - min)) * 24);
}

// Gauge: arc fill + needle for -100 to +100
const gaugeColor = computed(() => {
  const v = dashboardData.net_sentiment;
  return v < 0 ? "#ef4444" : v > 0 ? "#22c55e" : "#9ca3af";
});

const gaugeDashOffset = computed(
  () => 157 - (157 * (dashboardData.net_sentiment + 100)) / 200,
);

const gaugeNeedle = computed(() => {
  const angleDeg = 180 - ((dashboardData.net_sentiment + 100) / 200) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  return { x2: 60 + 40 * Math.cos(rad), y2: 60 - 40 * Math.sin(rad) };
});

const trendLabels = computed(() => dashboardData.trend.map((t) => t.date));

const trendDatasets = computed(() => [
  {
    label: "Positive",
    data: dashboardData.trend.map((t) => t.positive),
    borderColor: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.08)",
    fill: true,
  },
  {
    label: "Neutral",
    data: dashboardData.trend.map((t) => t.neutral),
    borderColor: "#94a3b8",
    backgroundColor: "rgba(148,163,184,0.08)",
    fill: true,
  },
  {
    label: "Negative",
    data: dashboardData.trend.map((t) => t.negative),
    borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.08)",
    fill: true,
  },
]);

const mentionByPlatformWithPct = computed(() => {
  const items = dashboardData.mention_by_platform;
  const total = items.reduce((sum, i) => sum + (i.count || 0), 0);
  return items.map((i) => ({
    ...i,
    pct: total > 0 ? Math.round((i.count / total) * 100) : 0,
  }));
});

const provinceLabels = computed(() =>
  dashboardData.mention_by_province.map((p) => p.province),
);
const provinceDatasets = computed(() => [
  {
    label: 'Mentions',
    data: dashboardData.mention_by_province.map((p) => p.count),
    backgroundColor: '#1a237e',
    borderRadius: 3,
  },
]);

const mentionByMedia = computed(() => {
  if (dashboardData.mention_by_media.length) return dashboardData.mention_by_media;
  // Derive from table rows grouped by author when API returns no media data
  const counts = {};
  dashboardData.table.forEach((row) => {
    const key = row.author || row.media || row.source;
    if (key && key.trim()) counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([media, count]) => ({ media, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

const mediaLabels = computed(() => mentionByMedia.value.map((m) => m.media));
const mediaDatasets = computed(() => [
  {
    label: 'Mentions',
    data: mentionByMedia.value.map((m) => m.count),
    backgroundColor: '#3949ab',
    borderRadius: 3,
  },
]);

const sentimentPlatformLabels = computed(() =>
  dashboardData.platform_sentiment.map((p) => p.platform),
);

const sentimentPlatformDatasets = computed(() => [
  {
    label: "Positive",
    data: dashboardData.platform_sentiment.map((p) => p.positive),
    backgroundColor: "#1e40af",
    borderRadius: 2,
  },
  {
    label: "Neutral",
    data: dashboardData.platform_sentiment.map((p) => p.neutral),
    backgroundColor: "#94a3b8",
    borderRadius: 2,
  },
  {
    label: "Negative",
    data: dashboardData.platform_sentiment.map((p) => p.negative),
    backgroundColor: "#f87171",
    borderRadius: 2,
  },
]);

function measurePlatformCard() {
  nextTick(() => {
    if (platformCardRef.value) {
      platformCardHeight.value = platformCardRef.value.offsetHeight;
    }
  });
}

function measureNetSentimentCard() {
  nextTick(() => {
    const h1 = netSentimentCardRef.value?.offsetHeight ?? 0;
    const h2 = sentimentPctCardRef.value?.offsetHeight ?? 0;
    const h = Math.max(h1, h2);
    if (h > 0) overviewRowHeight.value = h;
  });
}

onMounted(loadDashboard);
watch(loading, (val) => {
  if (!val) {
    if (activeTab.value === 'detail') measurePlatformCard();
    if (activeTab.value === 'overview') measureNetSentimentCard();
  }
});
watch(activeTab, (val) => {
  if (val === 'detail') measurePlatformCard();
  if (val === 'overview') measureNetSentimentCard();
});
</script>

<style scoped>
@media (min-width: 1024px) {
  .overview-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr) minmax(0, 1.3fr) minmax(0, 1.3fr);
  }
}
</style>
