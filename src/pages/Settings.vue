<template>
  <div class="settings">
    <header class="topbar">
      <h1>⚙️ Settings</h1>
      <RouterLink to="/dashboard">← Dashboard</RouterLink>
    </header>

    <main class="content">
      <div class="card">
        <h2>Platform Preferences</h2>
        <p>Select the platforms you want to track:</p>

        <div class="platform-list">
          <label
            v-for="p in availablePlatforms"
            :key="p.value"
            class="platform-item"
          >
            <input type="checkbox" :value="p.value" v-model="selected" />
            <span>{{ p.label }}</span>
          </label>
        </div>

        <p v-if="message" :class="['msg', messageType]">{{ message }}</p>

        <button @click="savePreferences" :disabled="saving">
          {{ saving ? "Saving..." : "Save Preferences" }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";

const availablePlatforms = [
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "facebook", label: "📘 Facebook" },
];

const selected = ref([]);
const saving = ref(false);
const message = ref("");
const messageType = ref("success");

onMounted(async () => {
  try {
    const { data } = await api.get("/preferences");
    selected.value = data?.platforms || [];
  } catch {
    selected.value = [];
  }
});

async function savePreferences() {
  saving.value = true;
  message.value = "";
  try {
    await api.put("/preferences", { platforms: selected.value });
    message.value = "Preferences saved successfully!";
    messageType.value = "success";
  } catch {
    message.value = "Failed to save preferences.";
    messageType.value = "error";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.settings {
  min-height: 100vh;
  background: #f8fafc;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #4f46e5;
  color: #fff;
}
.topbar h1 {
  margin: 0;
  font-size: 1.25rem;
}
.topbar a {
  color: #fff;
  text-decoration: none;
}
.content {
  padding: 2rem;
  max-width: 520px;
}
.card {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.card h2 {
  margin-top: 0;
}
.platform-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.platform-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
}
.platform-item input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
button {
  padding: 0.7rem 1.5rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.msg {
  padding: 0.6rem 1rem;
  border-radius: 4px;
  margin: 0.75rem 0;
  font-size: 0.875rem;
}
.success {
  background: #d1fae5;
  color: #065f46;
}
.error {
  background: #fee2e2;
  color: #991b1b;
}
</style>
