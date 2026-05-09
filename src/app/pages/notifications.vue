<template>
    <div class="max-width" v-if="enabled">
        <ClientOnly>
            <Tabs>
                <Tab title="General" icon="settings" keep-alive>
                    <div class="flex fill fill-parent">
                        <div class="flex row center max-size-input">
                            <Loading v-if="tokenLoading" />
                            <template v-else-if="!token">
                                <p class="center text-center">Push notifications are not enabled on this device.</p>
                                <p class="center text-center">To enable push notifications, please click the button below.</p>
                                <p class="center text-center">If you have previously disabled push notifications, you may need to enable them in your device settings.</p>
                                <IconBtn
                                    class="center-horz"
                                    color="primary"
                                    icon="notifications"
                                    text="Enable Notifications"
                                    @click="request"
                                />

                                <p class="margin-top mute center text-center" v-if="tokenError">
                                    <b>Current Error:</b> {{ tokenError }}
                                </p>
                            </template>
                            <template v-else-if="!devicesCurrent || !devicesCurrent.active">
                                <p class="center text-center">Now that you've enabled push notifications, let's register your device with MB's server.</p>
                                <p class="center text-center margin-bottom">What do you want this device to be called?</p>
                                <InputGroup
                                    v-model="deviceName"
                                    placeholder="Device Name"
                                    class="max-size-input center-horz"
                                    :disabled="devicesLoading"
                                />
                                <IconBtn
                                    :disabled="!deviceName.trim() || devicesLoading"
                                    class="center-horz margin-top"
                                    color="primary"
                                    icon="notifications"
                                    text="Register Device"
                                    @click="register"
                                />

                                <Loading v-if="devicesLoading" class="margin-top" inline />

                                <p class="margin-top mute center text-center" v-if="devicesError">
                                    <b>An Error Occurred:</b> {{ devicesError }}
                                </p>
                            </template>
                            <template v-else>
                                <p>Your device, <b>{{ devicesCurrent.name }}</b>, is registered for push notifications.</p>
                                <p>What sort of notifications would you like to receive?</p>

                                <div class="flex margin-top">
                                    <CheckBox v-model="favourites">
                                        Updates to any manga in my favourites list.
                                    </CheckBox>
                                </div>

                                <div class="flex margin-top">
                                    <CheckBox v-model="inProgress">
                                        Updates to any manga I'm currently reading.
                                    </CheckBox>
                                </div>
                                <IconBtn
                                    :disabled="settingsLoading"
                                    pad-left
                                    class="margin-top"
                                    color="primary"
                                    icon="save"
                                    text="Save Settings"
                                    @click="save"
                                />

                                <p class="margin-top">
                                    You will always receive notifications for manga or authors/artists you are subscribed to, regardless of these settings.
                                </p>

                                <p class="margin-top mute" v-if="settingsError">
                                    <b>Error saving settings:</b> {{ settingsError }}
                                </p>
                            </template>
                        </div>
                    </div>

                </Tab>
                <Tab title="Devices" icon="devices" scrollable keep-alive>
                    <p class="center text-center">Here are all of your current devices! ({{ devices.length }})</p>
                    <Loading v-if="devicesLoading" class="margin-top" />
                    <Card
                        v-for="device in devices"
                        :key="device.id"
                        :title="device.name"
                        :style="ListStyle.Compact"
                        :description="device.id === devicesCurrent?.id ? 'This device!' : ''"
                        no-mask
                    >
                        <CardLine title="Registered" :style="style">
                            <Date :date="device.updatedAt" utc format="s" /> - <Date :date="device.updatedAt" format="R" utc />
                        </CardLine>
                        <CardLine title="Status" :style="style">
                            <span :style="`color: var(${device.active ? '--color-success' : '--color-danger'})`">{{ device.active ? 'Active' : 'Inactive' }}</span>
                        </CardLine>

                        <template #title>
                            <IconBtn
                                icon="delete"
                                inline
                                color="danger"
                                @click="unregister(device)"
                                :disabled="devicesLoading"
                            />
                        </template>
                    </Card>
                </Tab>
                <Tab title="Subs" icon="notifications" scrollable keep-alive>
                    <p class="center text-center">Here is everything you're currently subscribed to for notifications. ({{ subs.length }})</p>
                    <p class="center text-center mute">Editing these coming soon...</p>
                    <template
                        v-for="sub in subs"
                        :key="sub.subject.id"
                    >
                        <MangaCard
                            v-if="sub.manga"
                            :manga="sub.manga"
                            :link="`/manga/${sub.manga.entity.id}`"
                            :content-ratings="contentRatings"
                        />
                        <Card
                            v-else
                            :title="`Subscription #${sub.subject.id}`"
                            :description="sub.subject.mangaId ? `Manga ID: ${sub.subject.mangaId}` : `Person ID: ${sub.subject.personId}`"
                            :style="ListStyle.Compact"
                        />
                    </template>
                </Tab>
                <Tab title="Notifications" icon="notifications_unread" scrollable keep-alive>
                    <div class="flex row">
                        <p class="center text-center">Here are all notifications shown while the application has been open. ({{ notifications.length }})</p>
                        <Card
                            v-for="notif in notifications"
                            :key="notif.notification.messageId"
                            :cover="notif.notification.notification?.image"
                            :title="notif.notification.notification?.title ?? 'A notification'"
                            :description="notif.notification.notification?.body"
                            :style="style"
                            :link="notif.notification.data?.route"
                        >
                            <CardLine title="Received At" :style="style">
                                <Date :date="notif.received" format="F" /> - <Date :date="notif.received" format="R" utc />
                            </CardLine>
                            <CardLine title="Dismissed" :style="style" v-if="notif.dismissed">
                                This notification has been dismissed.
                            </CardLine>
                        </Card>
                    </div>
                </Tab>
            </Tabs>
        </ClientOnly>
    </div>
    <div class="max-width" v-else>
        <Error message="Notifications aren't enabled on this device!" />
    </div>
</template>

<script setup lang="ts">
import { ListStyle } from '~/models';
import type { MbNotificationDevice } from '~/models';

const { currentUser } = useAuthHelper();
const notify = useNotificationHelper();
const cache = useCacheHelper();
const api = useMangaApi();

const enabled = computed(() => notify.enabled);
const devices = computed(() => notify.devices.value.value);
const devicesLoading = computed(() => notify.devices.loading.value);
const devicesError = computed(() => notify.devices.error.value);
const devicesCurrent = computed(() => notify.devices.current.value);

const subs = computed(() => notify.subscriptions.value.value);
const subsLoading = computed(() => notify.subscriptions.loading.value);
const subsError = computed(() => notify.subscriptions.error.value);

const token = computed(() => notify.token.value.value);
const tokenLoading = computed(() => notify.token.loading.value);
const tokenError = computed(() => notify.token.error.value);
const notifications = computed(() => notify.token.notifications.value);

const deviceName = ref('');
const favourites = ref(false);
const inProgress = ref(false);

const settingsLoading = ref(false);
const settingsError = ref<string>();

const style = ref(ListStyle.Expanded);

const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);

const refresh = () => notify.refresh();
const request = () => notify.prompt();
const register = () => notify.devices.register(deviceName.value);
const unregister = (device: MbNotificationDevice) => notify.devices.unregister(device);

const save = async () => {
    if (!currentUser.value || settingsLoading.value) return;

    settingsLoading.value = true;
    settingsError.value = undefined;

    try {
        const resp = await api.promise.notifications.settings({
            favourites: favourites.value,
            inProgress: inProgress.value
        });

        if (!api.isSuccess(resp)) {
            settingsError.value = api.errorMessage(resp) || 'Failed to save notification settings';
            return;
        }
    } catch (err) {
        settingsError.value = err?.toString() || 'An unknown error occurred while saving notification settings';
    } finally {
        settingsLoading.value = false;
    }
}

watch(currentUser, () => {
    if (!currentUser.value) return;

    favourites.value = currentUser.value.notifyFavourites;
    inProgress.value = currentUser.value.notifyInProgress;
}, { immediate: true });

useHead({ title: 'Notifications' });

</script>

<style lang="scss" scoped>

.max-size-input {
    max-width: 500px;
    width: 100%;
}
</style>
