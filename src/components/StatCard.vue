<template>
  <div class="bg-white rounded-xl shadow p-4">
    <p
      class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2"
    >
      {{ title }}
    </p>
    <slot />
  </div>
</template>

<script setup>
defineProps({ title: String });
</script>
