import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

type RequestResponse = {
    error?: string;
    token?: string;
    exception?: Error;
}

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const firebase = initializeApp(config.public.firebase);
    const messaging = getMessaging(firebase);

    async function serviceWorkerRegistration() {
        if (!('serviceWorker' in navigator))
            return {
                error: 'Service workers are not supported in this browser'
            };

        try {
            const swConfig = config.public.prod ? {
                url: '/sw.js',
                mode: <WorkerType>'classic'
            } : {
                url: '/dev-sw.js?dev-sw',
                mode: <WorkerType>'module'
            };

            const registration = await navigator.serviceWorker.register(
                swConfig.url, { type: swConfig.mode });
            if (!registration) {
                return {
                    error: 'Failed to register service worker'
                }
            }

            return {
                registration
            }
        } catch (error) {
            return {
                error: 'An error occurred while registering the service worker',
                exception: error as Error
            }
        }
    }

    async function checkToken(): Promise<RequestResponse> {
        try {
            if (Notification.permission !== 'granted') {
                return {
                    error: 'Notification permission not granted'
                }
            }

            const registration = await serviceWorkerRegistration();
            if (registration.error || !registration.registration) {
                return {
                    error: registration?.error ?? 'Service worker registration failed'
                }
            }

            const token = await getToken(messaging, {
                vapidKey: config.public.firebase.vapidKey,
                serviceWorkerRegistration: registration.registration
            });
            if (!token) {
                return {
                    error: 'Failed to get FCM token'
                }
            }
            return { token };
        } catch (error) {
            return {
                error: 'An error occurred while checking token',
                exception: error as Error
            }
        }
    }

    async function requestPermission(): Promise<RequestResponse> {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return {
                    error: 'Permission not granted for Notification'
                }
            }

            const registration = await serviceWorkerRegistration();
            if (registration.error || !registration.registration) {
                return {
                    error: registration?.error ?? 'Service worker registration failed'
                }
            }

            const token = await getToken(messaging, {
                vapidKey: config.public.firebase.vapidKey,
                serviceWorkerRegistration: registration.registration
            });
            if (!token) {
                return {
                    error: 'Failed to get FCM token'
                }
            }

            return { token }
        } catch (error) {
            return {
                error: 'An error occurred while requesting permission',
                exception: error as Error
            }
        }
    }

    return {
        provide: {
            fire: {
                messaging,
                requestPermission,
                checkToken,
                onMessage,
            }
        }
    }
});
