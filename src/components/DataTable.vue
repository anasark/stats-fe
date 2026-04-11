<template>
  <div class="overflow-x-auto">
    <table class="w-full text-xs text-left">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="i"
          class="border-b border-slate-100 hover:bg-slate-50"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-3 py-2 text-slate-700 whitespace-nowrap"
          >
            <span
              v-if="col.key === 'sentiment'"
              :class="sentimentClass(row[col.key])"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
            >
              {{ row[col.key] }}
            </span>
            <span v-else>{{ row[col.key] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
});

function sentimentClass(val) {
  if (val === "positive") return "bg-green-100 text-blue-700";
  if (val === "negative") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}
</script>
