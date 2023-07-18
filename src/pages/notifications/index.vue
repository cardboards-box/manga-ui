<template>
<div class="max-width">
    <Error v-if="!currentUser" message="You need to be logged in to manage push notifications"/>
    <Error v-else-if="notificationState === 'unsupported'" message="Push notifications are not supported in your browser"/>
    <div v-else-if="notificationState === 'granted'" class="center flex row">
        <h1>Manage your push notifications!</h1>
        <IconBtn
            other-classes="center"
            text="Show Code"
            icon="notifications"
            color="primary"
            @click="() => enableNotifications()"
        />
        <input type="text" v-model="token" />
        <input type="text" v-model="ua" />
    </div>
    <div v-else class="center flex row">
        <h1>Push Notifications</h1>
        <p class="alert" v-if="notificationState === 'denied'">You've previously denied push notifications!</p>

        <IconBtn
            other-classes="center"
            text="Enable Notifications"
            icon="notifications"
            color="primary"
            @click="() => enableNotifications()"
        />
        <IconBtn
            other-classes="center"
            text="Disable Notifications"
            icon="notifications"
            color="primary"
            @click="() => disableNotifications()"
        />
    </div>
</div>
</template>

<script setup lang="ts">

const { currentUser } = useAuthApi();
const { resolveToken, notificationState } = useFirebase();

const isAvabilable = ('serviceWorker' in navigator) && ('PushManager' in window);
const token = ref('');
const ua = ref(navigator.userAgent.toString());

const disableNotifications = async () => {

};

const enableNotifications = async () => {
    token.value = await resolveToken();
    console.log('Found token', { token: token.value });
};

const updateSubscription = (sub: PushSubscription) => {
    console.log('Push Notification Subscription', { sub });
    console.log(sub.endpoint);
    //do something with the subscription
};

onMounted(() => {

});
</script>

<style scoped lang="scss">

</style>
