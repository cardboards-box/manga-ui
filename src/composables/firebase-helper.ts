import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";

type State = 'unsupported' | 'granted' | 'denied' | 'default';

export const useFirebase = () => {
    const config = useRuntimeConfig();
    const app = initializeApp(config.public.firebase);
    const messaging = getMessaging(app);

    console.log('Registering messaging listener');
    onMessage(messaging, (payload) => {
        console.log('Found message payload', { payload });
    });
    console.log('Registered');

    const state = useState<State>('firebase-messaging-state', () => {
        const isAvabilable = ('serviceWorker' in navigator) && ('PushManager' in window);

        if (!isAvabilable) return 'unsupported';

        const permission = Notification.permission;
        switch(permission) {
            case 'granted': return 'granted';
            case 'denied': return 'denied';
            default: return 'default';
        }
    });

    const resolveToken = async () => {
        const reger = await navigator.serviceWorker.ready;

        return await getToken(messaging, {
            vapidKey: config.public.firebase.vapidKey,
            serviceWorkerRegistration: reger
        });
    }

    return {
        messaging,
        notificationState: state,
        resolveToken
    };
}
