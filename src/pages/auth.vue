<template>
    <Error v-if="failureReason" :message="failureReason" />
    <Loading v-else />
</template>

<script setup lang="ts">
const route = useRoute();
const { failureReason, resolve, loginReturnUrl } = useAuthApi();
const { injectSettings } = useAppSettings();

useHead({ title: 'Logging you into something really fancy!' });

const code = computed(() => route.query.code?.toString());
const pending = ref(false);

const triggerLogin = async () => {
    if (!code.value || pending.value) return;

    pending.value = true;
    const result = await resolve(code.value);
    pending.value = false;
    if (!result) return;

    injectSettings();
    if (!loginReturnUrl.value ||
        loginReturnUrl.value.trim() === '/auth') {
        navigateTo('/account');
        return;
    }
    navigateTo(loginReturnUrl.value || '/account');
}

watch(() => code.value, triggerLogin);
onMounted(() => nextTick(() => triggerLogin()));
</script>
