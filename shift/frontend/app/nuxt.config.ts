import { fileURLToPath, URL } from 'node:url';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/shift/' : '/shift/';
const apiBase =
  process.env.NUXT_PUBLIC_API_BASE?.trim() ||
  (isProduction ? '/shift-api' : 'http://127.0.0.1:8081/shift-api');

export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt'],
  alias: {
    '@': fileURLToPath(new URL('.', import.meta.url)),
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    baseURL: basePath,
    buildAssetsDir: '_nuxt',
    head: {
      title: 'Shift',
      htmlAttrs: { lang: 'es' },
    },
  },
  nitro: {
    preset: 'static',
  },
  vite: {
    base: basePath,
  },
  runtimeConfig: {
    public: {
      apiBase,
    },
  },
});
