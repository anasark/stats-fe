<template>
  <div ref="containerRef" class="relative w-full h-full">
    <canvas ref="canvasRef" class="w-full h-full" />
    <p v-if="!words.length" class="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">No data</p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import WordCloud from 'wordcloud';

const props = defineProps({
  words: {
    type: Array,
    default: () => [],
  },
  color: {
    type: String,
    default: 'blue', // 'blue' | 'red'
  },
});

const canvasRef = ref(null);
const containerRef = ref(null);
let ro = null;

const blueShades = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#0ea5e9'];
const redShades  = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#b91c1c', '#e11d48', '#f43f5e'];

function getColor() {
  const palette = props.color === 'red' ? redShades : blueShades;
  return () => palette[Math.floor(Math.random() * palette.length)];
}

function draw() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container || !props.words.length) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = w;
  canvas.height = h;

  const maxCount = Math.max(...props.words.map((w) => w.count));
  const minCount = Math.min(...props.words.map((w) => w.count));
  const range = maxCount - minCount || 1;

  // Map counts to font sizes relative to canvas size
  const minSize = Math.max(10, Math.round(h * 0.06));
  const maxSize = Math.max(28, Math.round(h * 0.22));

  const list = props.words.map((item) => {
    const normalized = (item.count - minCount) / range;
    const size = Math.round(minSize + normalized * (maxSize - minSize));
    return [item.word, size];
  });

  WordCloud(canvas, {
    list,
    gridSize: Math.round(Math.max(w, h) / 40),
    weightFactor: 1,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    color: getColor(),
    rotateRatio: 0.4,
    rotationSteps: 2,
    backgroundColor: '#ffffff',
    shrinkToFit: true,
    drawOutOfBound: false,
  });
}

onMounted(() => {
  nextTick(() => {
    draw();
    ro = new ResizeObserver(() => {
      draw();
    });
    if (containerRef.value) ro.observe(containerRef.value);
  });
});

onBeforeUnmount(() => {
  if (ro) ro.disconnect();
});

watch(() => props.words, () => nextTick(draw), { deep: true });
watch(() => props.color, () => nextTick(draw));
</script>
