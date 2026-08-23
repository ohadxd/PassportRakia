export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  experimental: {
    appManifest: false
  },
  routeRules: {
    '/apple-touch-icon.png': { redirect: '/icons/apple-touch-icon.svg' },
    '/apple-touch-icon-precomposed.png': { redirect: '/icons/apple-touch-icon.svg' }
  },
  modules: ['@vite-pwa/nuxt'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  css: ['~/assets/styles/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'he', dir: 'rtl' },
      title: 'דרכון משימת רקיע',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content' },
        { name: 'theme-color', content: '#07172f' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'רקיע' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'description', content: 'דרכון PWA לתערוכת משימת רקיע' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/icons/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.svg' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      firebaseAppCheckRecaptchaKey: process.env.NUXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY || '',
      rakiaArBaseUrl: process.env.NUXT_PUBLIC_RAKIA_AR_BASE_URL || 'https://www.rakiamission.com/'
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'דרכון משימת רקיע',
      short_name: 'רקיע',
      description: 'דרכון דיגיטלי לתערוכת משימת רקיע',
      lang: 'he',
      dir: 'rtl',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      background_color: '#07172f',
      theme_color: '#07172f',
      icons: [
        { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        { src: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2,mp3}'],
      globIgnores: ['**/mission-videos/**', '**/mission-models/**', '**/*.mp4', '**/*.webm', '**/*.mov', '**/babylon-jewelry*.js', '**/HavokPhysics*.wasm'],
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /\/_nuxt\/babylon-jewelry.*\.js$/i,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'rakia-jewelry-engine' }
        },
        {
          urlPattern: /\/_nuxt\/HavokPhysics(?:[.-].*)?\.wasm$/i,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'rakia-jewelry-physics' }
        },
        {
          urlPattern: /\.(?:js|css|html|svg|png|jpg|jpeg|webp|woff2)$/i,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'rakia-app-shell' }
        },
        {
          urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/.*mission-(?:videos|models)(?:%2F|\/).*\.mp4(?:\?|$)/i,
          handler: 'NetworkOnly',
          options: { cacheName: 'rakia-video-network-only' }
        }
      ]
    }
  },
  vite: {
    optimizeDeps: { include: ['three', 'jspdf', 'html2canvas'] },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@babylonjs')) return 'babylon-jewelry'
          }
        }
      }
    }
  }
})
