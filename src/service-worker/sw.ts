/// <reference lib="WebWorker" />
import FIREBASE_CONFIG from '../firebase.config';
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

try {
    const handler = createHandlerBoundToURL('/');
    const route = new NavigationRoute(handler);
    registerRoute(route);
} catch (error) {
    console.warn('Error while registering cache route', { error });
}

const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, async (payload) => {
    console.log('[sw.ts] Received background message ', payload);
});

self.addEventListener('notificationclick', (event) => {
    const url = event.notification.data?.route || '/';
    event.notification.close();
    openUrl(wrapUrl(url), event);
});

function wrapUrl(url: string) {
    if (url.toLowerCase().startsWith('http')) return url;

    const baseUrl = self.location.origin;
    return new URL(url, baseUrl).href;
}

function openUrl(url: string, event: ExtendableEvent) {
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if a tab with this URL is already open
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no tab is open, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
}

console.log('Service worker registered');
