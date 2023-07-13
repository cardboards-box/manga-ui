<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>

    <div class="manga-latest" v-if="latest.length > 0">
        <header>
            <h2>Latest Releases: ({{ latest.length }})</h2>
            <IconBtn icon="close" @click="() => latest = []" />
        </header>
        <div class="list">
            <Card v-for="manga of latest" :manga="manga" :overridestyle="ListStyle.Compact" />
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ListStyle, ProgressExt } from '~/models';
const { fixBgImage, injectSettings, lastCheck } = useAppSettings();
const { toPromise } = useApiHelper();
const { bump, currentUser } = useAuthApi();
const { since } = useMangaApi();

const latest = ref<ProgressExt[]>([]);
let watcher: NodeJS.Timeout | undefined = undefined;

const bumpManga = async () => {
    const now = dayjs();

    if (!currentUser.value) return [];
    if (!lastCheck.value) {
        lastCheck.value = now.toDate();
        return [];
    }

    const diff = now.diff(lastCheck.value, 'minutes');
    if (diff <= 1) return [];

    lastCheck.value = now.toDate();
    const data = await toPromise(since(now.toDate()));
    return data?.results ?? [];
};

onMounted(() => nextTick(async () => {
    fixBgImage();

    if (await bump()) {
        injectSettings();
    }

    watcher = setTimeout(async () => {
        latest.value = await bumpManga();
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
