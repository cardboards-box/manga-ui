<template>
    <NuxtLayout>
        <!--:key="$route.path"-->
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
const { fixBgImage, injectSettings } = useAppSettings();
const { bump } = useAuthHelper();
const { $pwa } = useNuxtApp();

let watcher: NodeJS.Timeout | undefined = undefined;

const selfupdateIfNecessary = () => {
    if (!$pwa || !$pwa.swActivated) {
        return;
    }

    if ($pwa.needRefresh) {
        console.log("Website update found, updating...");
        $pwa.updateServiceWorker();
    }
};
// if necessary, update on first load
selfupdateIfNecessary();

onMounted(() => nextTick(async () => {
    fixBgImage();

    if (await bump()) {
        injectSettings();
    }

    watcher = setTimeout(async () => {
        selfupdateIfNecessary();
    }, 60 * 1000);
}));

onUnmounted(() => {
    if (watcher) clearTimeout(watcher);
});
</script>

<style lang="scss">
.page-enter-active,
.page-leave-active {
    transition: all 150ms;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
    filter: blur(1rem);
}

.manga-latest {
    position: fixed;
    display: flex;
    flex-flow: column;
    bottom: 5px;
    right: 5px;
    overflow: hidden;
    border-radius: var(--brd-radius);
    background-color: var(--bg-color-accent-dark);
    padding: 10px;

    width: 100%;
    height: 100%;
    max-width: min(400px, 80vw);
    max-height: min(600px, 80vh);

    header {
        display: flex;
        flex-flow: row;

        h2 {
            flex: 1;
            margin: auto 0;
        }
    }

    .list {
        flex: 1;
        overflow-y: auto;
        padding: 5px;
    }
}
</style>
