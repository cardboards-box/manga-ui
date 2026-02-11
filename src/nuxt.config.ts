import webManifest from './webmanifest';
import FIREBASE_CONFIG from './firebase.config';


const baseUrl = 'https://mangabox.app';
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: false },
    modules: [
        '@nuxt/image',
        '@vite-pwa/nuxt'
    ],
    image: {
        provider: 'none'
    },
    nitro: {
        preset: 'bun',
        typescript: {
            tsConfig: {
                compilerOptions: {
                    noUncheckedIndexedAccess: false
                }
            }
        }
    },
    app: {
        head: {
            link: [
                { rel: 'manifest', href: '/manifest.webmanifest' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&amp;display=swap' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Kolker+Brush&display=swap' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200' },
            ],
            meta: [
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
                { name: 'viewport', content: 'initial-scale=1, viewport-fit=cover, width=device-width' },
            ]
        },
        pageTransition: { name: 'page', mode: 'out-in' }
    },
    css: [
        './node_modules/highlight.js/styles/vs2015.css',
        './styles/variables.scss',
        './styles/reset.scss',
        './styles/styles.scss',
        './styles/layout.scss',
        './styles/controls.scss',
    ],
    components: [
        '~/components/general',
        '~/components/general/tabs',
        '~/components/buttons',
        '~/components/reader',
        '~/components/manga',
        '~/components/manga/volumes',
        '~/components/manga/cards',
        '~/components'
    ],
    runtimeConfig: {
        public: {
            apiUrl: 'http://192.168.1.137:10101',
            imageUrl: 'http://192.168.1.137:10101',
            baseUrl: baseUrl,
            firebase: FIREBASE_CONFIG,
            prod: process.env.NODE_ENV === 'production',
        }
    },
    pwa: {
        registerType: 'prompt',
        strategies: "injectManifest",
        includeAssets: [], // do not precache all the JS, it's really stupid
        includeManifestIcons: false,
        manifest: webManifest({ baseUrl: baseUrl }),
        srcDir: '../public',
        filename: 'sw.js',
        workbox: {
            navigateFallback: '/',
            globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        },
        client: {
            registerPlugin: true,
            installPrompt: true,
            periodicSyncForUpdates: 3600, // 1h, in seconds
        },
        devOptions: {
            enabled: true,
            navigateFallbackAllowlist: [/^\/$/],
            type: 'module',
        },
    },
    routeRules: {
        '/chapter/**': { ssr: false },
        '/manga/**/admin': { ssr: false },
    }
})
