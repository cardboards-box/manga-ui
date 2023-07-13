<template>
    <Error v-if="failureReason" :message="failureReason" />
    <Loading v-else />
</template>

<script setup lang="ts">
const route = useRoute();
const { failureReason, resolve, loginReturnUrl } = useAuthApi();
const { injectSettings } = useAppSettings();

useHead({ title: 'Logging you into something really fancy!' });

onMounted(() => nextTick(() => setTimeout(async () => {
    const code = route.query.code?.toString();

    const result = await resolve(code);
    if (!result) return;

    injectSettings();
    navigateTo(loginReturnUrl.value || '/account');
}, 300)));
</script>