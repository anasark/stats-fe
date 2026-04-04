<template>
  <Icon :icon="iconName" :width="size" :height="size" :style="{ color: iconColor }" />
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  platform: { type: String, default: '' },
  size: { type: [Number, String], default: 18 },
});

const PLATFORM_MAP = {
  facebook:      { icon: 'ri:facebook-fill',  color: '#1877F2' },
  instagram:     { icon: 'ri:instagram-fill',  color: '#E1306C' },
  tiktok:        { icon: 'ri:tiktok-fill',     color: '#010101' },
  twitter:       { icon: 'ri:twitter-x-fill',  color: '#000000' },
  x:             { icon: 'ri:twitter-x-fill',  color: '#000000' },
  youtube:       { icon: 'ri:youtube-fill',    color: '#FF0000' },
  linkedin:      { icon: 'ri:linkedin-fill',   color: '#0A66C2' },
  threads:       { icon: 'ri:threads-fill',    color: '#101010' },
  reddit:        { icon: 'ri:reddit-fill',     color: '#FF4500' },
  news:          { icon: 'ri:global-line',     color: '#3949AB' },
  'online news': { icon: 'ri:global-line',     color: '#3949AB' },
};

const resolved = computed(() => {
  const key = (props.platform || '').toLowerCase().trim();
  return PLATFORM_MAP[key] ?? { icon: 'ri:share-circle-line', color: '#94a3b8' };
});

const iconName  = computed(() => resolved.value.icon);
const iconColor = computed(() => resolved.value.color);
</script>
