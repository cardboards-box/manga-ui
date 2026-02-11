import type { VitePWAOptions } from 'vite-plugin-pwa';

export interface WebManifestParams {
    baseUrl: string;
}

export default function webManifest(params: WebManifestParams): VitePWAOptions["manifest"] {
    return {
        name: 'MangaBox',
        short_name: 'MangaBox',
        description: 'Find your next manga binge on MangaBox!',
        categories: ['books', 'entertainment', 'comics', 'manga'],
        start_url: params.baseUrl,
        scope: '/',
        prefer_related_applications: false,
        protocol_handlers: [
            {
                protocol: 'web+mangabox',
                url: `${params.baseUrl}/%s`
            }
        ],
        related_applications: [],

        background_color: '#0c090c',
        dir: 'ltr',
        display: 'fullscreen',
        display_override: [
            "window-controls-overlay",
            "standalone",
            "minimal-ui",
            "fullscreen",
            "browser",
        ],
        orientation: "portrait-primary",
        theme_color: "#0c090c",

        icons: [
            {
                src: "/icons/icon-72x72.png",
                type: "image/png",
                sizes: "72x72",
                purpose: "any",
            },
            {
                src: "/icons/icon-96x96.png",
                type: "image/png",
                sizes: "96x96",
                purpose: "any",
            },
            {
                src: "/icons/icon-128x128.png",
                type: "image/png",
                sizes: "128x128",
                purpose: "any",
            },
            {
                src: "/icons/icon-144x144.png",
                type: "image/png",
                sizes: "144x144",
                purpose: "any",
            },
            {
                src: "/icons/icon-152x152.png",
                type: "image/png",
                sizes: "152x152",
                purpose: "any",
            },
            {
                src: "/icons/icon-192x192.png",
                type: "image/png",
                sizes: "192x192",
                purpose: "any",
            },
            {
                src: "/icons/icon-384x384.png",
                type: "image/png",
                sizes: "384x384",
                purpose: "any",
            },
            {
                src: "/icons/icon-512x512.png",
                type: "image/png",
                sizes: "512x512",
                purpose: "any",
            },
        ],

    }
}
