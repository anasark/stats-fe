<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div class="field">
          <label>Name</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="John Doe"
          />
        </div>
        <div class="field">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="email@example.com"
          />
        </div>
        <div class="field">
          <label>Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>
        <div class="field">
          <label>Confirm Password</label>
          <input
            v-model="form.password_confirmation"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? "Registering..." : "Register" }}
        </button>
        <p class="link">
          Already have an account? <RouterLink to="/login">Login</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();
const form = ref({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
});
const error = ref("");
const loading = ref(false);

async function handleRegister() {
  error.value = "";
  loading.value = true;
  try {
    const { data } = await api.post("/register", form.value);
    localStorage.setItem("token", data.token);
    router.push("/dashboard");
  } catch (e) {
    const errors = e.response?.data?.errors;
    error.value = errors
      ? Object.values(errors).flat().join(" ")
      : "Registration failed.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
}
.auth-card {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}
.field {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}
input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 0.7rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  color: #ef4444;
  font-size: 0.85rem;
}
.link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}
</style>
