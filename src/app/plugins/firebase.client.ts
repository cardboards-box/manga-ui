import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type MessagePayload, type Messaging } from 'firebase/messaging';

type RequestResponse = {
    error?: string;
    token?: string;
    exception?: Error;
}

export default defineNuxtPlugin(async () => {
    const config = useRuntimeConfig();

    const { firebase, messaging, enabled, worker } = await attemptRegister();

    async function attemptRegister() {
        try {
            const firebase = initializeApp(config.public.firebase);
            const messaging = getMessaging(firebase);
            const worker = await serviceWorkerRegistration();

            return {
                firebase,
                messaging,
                worker,
                enabled: true
            }
        } catch (error) {
            console.warn('Failed to initialize Firebase', { error });
            return {
                enabled: false,
                firebase: undefined,
                messaging: undefined,
                worker: undefined
            }
        }
    }

    async function serviceWorkerRegistration() {
        try {
            if (!('serviceWorker' in navigator))
                return {
                    error: 'Service workers are not supported in this browser'
                };

            if (!await isSupported())
                return {
                    error: 'Firebase messaging is not supported in this browser'
                };

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
            if (!enabled || !messaging || !firebase || !worker) {
                return {
                    error: 'Firebase initialization failed, messaging is not enabled'
                }
            }

            if (Notification.permission !== 'granted') {
                return {
                    error: 'Notification permission not granted'
                }
            }

            if (worker.error || !worker.registration) {
                return {
                    error: worker.error ?? 'Service worker registration failed'
                }
            }

            const token = await getToken(messaging, {
                vapidKey: config.public.firebase.vapidKey,
                serviceWorkerRegistration: worker.registration
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
            if (!enabled || !messaging || !firebase || !worker) {
                return {
                    error: 'Firebase initialization failed, messaging is not enabled'
                }
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return {
                    error: 'Permission not granted for Notification'
                }
            }

            if (worker.error || !worker.registration) {
                return {
                    error: worker.error ?? 'Service worker registration failed'
                }
            }

            const token = await getToken(messaging, {
                vapidKey: config.public.firebase.vapidKey,
                serviceWorkerRegistration: worker.registration
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

    async function onMessageHandler(callback: (payload: MessagePayload) => void) {
        try {
            if (!enabled || !messaging || !firebase) {
                return {
                    error: 'Firebase initialization failed, messaging is not enabled'
                }
            }

            if (!await isSupported()) {
                console.warn('Firebase messaging is not supported in this browser');
                return false;
            }

            onMessage(messaging, callback);
            return true;
        } catch (error) {
            console.error('Failed to set up onMessage listener', { error });
            return false;
        }
    }

    return {
        provide: {
            fire: {
                enabled,
                requestPermission,
                checkToken,
                onMessage: onMessageHandler
            }
        }
    }
});
