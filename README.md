# Vue 3 + Vite

## Runtime API URL in `dist`

This project now loads API URL from `config.js` at runtime, so you can change it on the server without rebuilding.

1. Build normally: `npm run build`
2. In your deployed files, edit `dist/config.js`
3. Set `API_BASE_URL` to your server URL

Example:

```js
window.__APP_CONFIG__ = {
	API_BASE_URL: "https://your-api-host.com",
};
```

Notes:
- `src/services/api.js` uses `window.__APP_CONFIG__.API_BASE_URL` first.
- If not set, it falls back to `VITE_API_BASE_URL` from build-time env.

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
