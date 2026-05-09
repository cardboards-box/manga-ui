import type {
    MbNotificationDevice,
    MbNotificationSubscription,
    MbPerson,
    MbTypeMangaSearch,
} from '~/models';
import type { MessagePayload } from 'firebase/messaging';

export type MbNotifications = {
    notification: MessagePayload;
    received: Date;
    dismissed: boolean;
}

export type MbSubject = {
    subject: MbNotificationSubscription;
    manga?: MbTypeMangaSearch;
    person?: MbPerson;
}

export const useNotificationHelper = () => {
    const { $fire } = useNuxtApp();
    const api = useMangaApi();
    const { canRead } = useAuthHelper();
    const { unique, sortBy } = useUtils();

    const token = {
        value: useState<string | undefined>('notifications-token', () => undefined),
        error: useState<string | undefined>('notifications-token-error', () => undefined),
        loading: useState<boolean>('notifications-token-loading', () => false),
        handlerSet: useState<boolean>('notifications-token-handler-set', () => false),
        notifications: useState<MbNotifications[]>('notifications', () => []),
    };

    const devices = {
        value: useState<MbNotificationDevice[]>('notifications-devices', () => []),
        loading: useState<boolean>('notifications-devices-loading', () => false),
        error: useState<string | undefined>('notifications-devices-error', () => undefined),
    };

    const subscriptions = {
        value: useState<MbSubject[]>('notifications-subscriptions', () => []),
        loading: useState<boolean>('notifications-subscriptions-loading', () => false),
        error: useState<string | undefined>('notifications-subscriptions-error', () => undefined),
    };

    const currentDevice = computed(() => {
        if (!token.value.value || !devices.value.value.length) return undefined;

        return devices.value.value.find(d => d.fcmToken === token.value.value);
    });

    function notificationReceived(payload: MessagePayload) {
        console.log('Received foreground message', payload);
        const notification: MbNotifications = {
            notification: payload,
            received: new Date(),
            dismissed: false,
        }
        let current = [...token.notifications.value, notification];
        current = unique(current, t => t.notification.messageId);
        current = sortBy(current, t => t.received.getTime());
        token.notifications.value = current;

        if (Notification.permission !== 'granted') return;

        const title = payload.notification?.title || 'New Notification Received!';
        const body = payload.notification?.body || 'You have received a new notification. Click to view.';
        const icon = payload.notification?.image || '/logo.png';

        const noti = new Notification(title, {
            body,
            data: payload.data,
            icon,
        });
        noti.onclick = () => {
            console.log('Notification clicked', { payload });
            window.focus();
            noti.close();
            dismissNotification(payload.messageId!);

            if (payload.data?.route) {
                navigateTo(payload.data.route);
            }
        }

        noti.onclose = () => {
            console.log('Notification closed', { payload });
            dismissNotification(payload.messageId!);
        }
    }

    function dismissNotification(messageId: string) {
        const notification = token.notifications.value.find(t => t.notification.messageId === messageId);
        if (!notification) return;
        notification.dismissed = true;
    }

    async function iterateManga(ids: string[]) {
        const SIZE = 100;
        const results = [];

        for (let i = 0; i < ids.length; i += SIZE) {
            const batch = ids.slice(i, i + SIZE);
            const resp = await api.promise.manga.search({ ids: batch, size: SIZE });
            if (!api.isSuccess(resp)) {
                console.error('Failed to fetch manga batch for notification subscriptions', {
                    batch,
                    response: resp,
                });
                continue;
            }
            const mangaResults = api.data(resp).data || [];
            results.push(...mangaResults);
        }

        return results;
    }

    async function refresh() {
        const doTokenCheck = async () => {
            if (token.value.value || token.loading.value) return;

            token.error.value = undefined;
            token.loading.value = true;

            try {
                const tokenResponse = await $fire.checkToken();
                if (tokenResponse.error || !tokenResponse.token) {
                    token.error.value = tokenResponse.error ?? 'Failed to get notification token';
                    return;
                }

                token.value.value = tokenResponse.token;
            } catch (err) {
                token.error.value = err?.toString() || 'An unknown error occurred while checking notification permission';
            } finally {
                token.loading.value = false;
            }
        }

        const doDeviceCheck = async () => {
            if (!canRead.value || devices.loading.value) return;

            devices.error.value = undefined;
            devices.loading.value = true;

            try {
                const resp = await api.promise.notifications.devices.get();
                if (!api.isSuccess(resp)) {
                    devices.error.value = api.errorMessage(resp) || 'Failed to fetch notification devices';
                    return;
                }

                devices.value.value = api.data(resp) || [];
            } catch (err) {
                devices.error.value = err?.toString() || 'An unknown error occurred while fetching notification devices';
            } finally {
                devices.loading.value = false;
            }
        }

        const doSubscriptionCheck = async () => {
            if (!canRead.value || subscriptions.loading.value) return;

            subscriptions.error.value = undefined;
            subscriptions.loading.value = true;

            try {
                const resp = await api.promise.notifications.subscriptions.get();
                if (!api.isSuccess(resp)) {
                    subscriptions.error.value = api.errorMessage(resp) || 'Failed to fetch notification subscriptions';
                    return;
                }

                const subjects = api.data(resp) || [];
                if (subjects.length === 0) return;

                const mangaIds = subjects.map(s => s.mangaId).filter((id): id is string => !!id);
                const manga = await iterateManga(mangaIds);

                const mangaMap = new Map(manga.map(m => [m.entity.id, m]));
                subscriptions.value.value = subjects.map(s => ({
                    subject: s,
                    manga: s.mangaId ? mangaMap.get(s.mangaId) : undefined,
                    person: undefined,
                }));
            } catch (err) {
                subscriptions.error.value = err?.toString() || 'An unknown error occurred while fetching notification subscriptions';
            } finally {
                subscriptions.loading.value = false;
            }
        }

        const registerHandler = async () => {
            if (token.handlerSet.value) return;

            try {
                $fire.onMessage($fire.messaging, (payload) => {
                    notificationReceived(payload);
                });
                token.handlerSet.value = true;
            } catch (ex) {
                console.error('Failed to set up notification message handler', { exception: ex });
            }
        }

        await Promise.all([
            doTokenCheck(),
            doDeviceCheck(),
            doSubscriptionCheck(),
            registerHandler(),
        ]);
    }

    async function prompt() {
        if (token.loading.value)
            return !!token.value.value;

        token.error.value = undefined;
        token.loading.value = true;

        try {
            const permissionResponse = await $fire.requestPermission();
            if (permissionResponse.error || !permissionResponse.token) {
                token.error.value = permissionResponse.error ?? 'Failed to get notification token';
                return false;
            }

            token.value.value = permissionResponse.token;
            return !!token.value.value;
        } catch (err) {
            token.error.value = err?.toString() || 'An unknown error occurred while requesting notification permission';
            return false;
        } finally {
            token.loading.value = false;
        }
    }

    async function register(name: string) {
        if (devices.loading.value)
            return;

        devices.loading.value = true;
        devices.error.value = undefined;

        try {
            if (!name.trim()) {
                devices.error.value = 'Device name cannot be empty';
                return;
            }

            if (!token.value.value && !await prompt()) {
                devices.error.value = 'Notification permission not granted';
                return;
            }

            if (!token.value.value) {
                devices.error.value = 'No notification token available';
                return;
            }

            const resp = await api.promise.notifications.devices.add(token.value.value, name);
            if (!api.isSuccess(resp)) {
                devices.error.value = api.errorMessage(resp) || 'Failed to register notification device';
                return;
            }

            devices.loading.value = false;
            await refresh();
        } catch (error) {
            devices.error.value = error?.toString() || 'An unknown error occurred while registering notification device';
        } finally {
            devices.loading.value = false;
        }
    }

    return {
        refresh,
        prompt,
        token: {
            value: computed(() => token.value.value),
            error: computed(() => token.error.value),
            loading: computed(() => token.loading.value),
            notifications: computed(() => token.notifications.value),
        },
        devices: {
            value: computed(() => devices.value.value),
            error: computed(() => devices.error.value),
            loading: computed(() => devices.loading.value),
            current: currentDevice,
            register,
        },
        subscriptions: {
            value: computed(() => subscriptions.value.value),
            error: computed(() => subscriptions.error.value),
            loading: computed(() => subscriptions.loading.value),
        }
    }
}
