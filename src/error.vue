<template>
<NuxtLayout>
    <div class="fill-parent flex">
        <div class="center flex row center-items">
            <h2>An error occurred:</h2>
            <code class="margin-top">{{ error?.statusMessage ?? error?.message ?? error }}</code>
            <IconBtn 
                icon="home"
                text="Go Home"
                @click="clear"
                other-classes="pad-left margin-top"
            />
        </div>
    </div>
</NuxtLayout>
</template>

<script setup lang="ts">
defineProps({ error: Object });

const clear = () => clearError({ redirect: '/' });
const { fixBgImage, injectSettings } = useAppSettings();
const { bump } = useAuthApi();

onMounted(() => nextTick(async () => {
    fixBgImage();

    if (await bump()) injectSettings();
}));
</script>