import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

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

const firebaseConfig = {
    apiKey: "AIzaSyCjbxF6HDhhDFPCHRK-uiNQJr4lHMbqIpo",
    authDomain: "cba-notifications.firebaseapp.com",
    projectId: "cba-notifications",
    storageBucket: "cba-notifications.appspot.com",
    messagingSenderId: "155147822026",
    appId: "1:155147822026:web:613194c8f188d355a92533",
    measurementId: "G-D6D2CNWNVD",
    vapidKey: 'BBBk0oO9zxh8OxFCIUYKxEcf0u25ZaRHLK8l6yljs2V-VKm2BPOYInV0zDiXwQ2hnmGBS8oTWyZizY5HrDgONEc'
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
