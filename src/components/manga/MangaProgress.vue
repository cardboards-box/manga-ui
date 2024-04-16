<template>
    <Loading v-if="!manga" />
    <template v-else>
        <Drawer title="Actions" default-closed>
            <div class="button-list flex row">
                <IconBtn
                    v-if="currentUser"
                    :loading="loading"
                    :icon="isFavourite ? 'heart_minus' : 'favorite'"
                    :fill="isFavourite"
                    :text="isFavourite ? 'Unfavourite' : 'Favourite'"
                    color="shade"
                    @click="toggleFavourite"
                />
                <IconBtn
                    v-if="currentUser && progress"
                    :loading="loading"
                    icon="delete"
                    text="Reset Progress"
                    color="shade"
                    @click="reset"
                />
                <IconBtn
                    v-if="currentUser"
                    :loading="loading"
                    icon="sync"
                    text="Reload From Source"
                    color="shade"
                    @click="reloadSource"
                />
                <IconBtn
                    icon="content_copy"
                    text="Copy Manga Url"
                    color="shade"
                    @click="copyUrl"
                />
                <IconBtn
                    v-if="currentUser"
                    :loading="loading"
                    :icon="progress && progress.read.length > 0 ? 'visibility_off' : 'visibility'"
                    :text="progress && progress.read.length > 0 ? 'Mark all as Unread' : 'Mark all as Read'"
                    color="shade"
                    @click="toggleReadAll"
                />
                <IconBtn
                    v-if="currentUser && currentUser.roles.indexOf('Admin') !== -1"
                    icon="edit"
                    text="Admin Edit"
                    color="shade"
                    :link="`/manga/${manga.id}/admin`"
                />
            </div>
        </Drawer>
        <Drawer title="Progress">
            <div class="progress-options">
                <ProgressBar
                    :percent="stats?.chapterProgress ?? 0"
                    icon="menu_book"
                    label="Manga Progress"
                    :link="link"
                />

                <ProgressBar
                    v-if="pageLength !== 0"
                    :percent="stats?.pageProgress ?? 0"
                    :label="title"
                    icon="auto_stories"
                    :side-label="`${(progress?.pageIndex ?? 0) + 1}/${pageLength}`"
                    :link="link"
                />

                <div class="flex margin-top">
                    <Icon class="margin-right">event</Icon>
                    <span class="fill center-vert">Last Opened</span>
                    <span v-if="!progress" class="center-vert">Never</span>
                    <Date v-else :date="progress.updatedAt" format="r" utc class="center-vert" />
                </div>
            </div>
        </Drawer>
    </template>

</template>

<script setup lang="ts">
const { toPromise } = useApiHelper();
const { currentUser } = useAuthApi();
const { favourite, resetProgress, reload, markAsRead } = useMangaApi();
const { data, refresh } = useMangaCache();

const loading = ref(false);
const manga = computed(() => data.value?.manga);
const progress = computed(() => data.value?.progress);
const chapter = computed(() => data.value?.chapter);
const pageLength = computed(() => chapter.value?.pages.length ?? 0);
const stats = computed(() => data.value?.stats);

const link = computed(() => `/manga/${manga.value?.id}/${chapter.value?.id}?page=${(progress.value?.pageIndex ?? 0) + 1}`);
const title = computed(() => (chapter.value?.volume ? `Vol. ${chapter.value.volume} ` : '') + `Ch. ${chapter.value?.ordinal} - ${chapter.value?.title}`);
const isFavourite = computed(() => stats.value?.favourite ?? false);

const toggleFavourite = async () => {
    if (!currentUser.value || !manga.value) return;

    loading.value = true;
    await toPromise(favourite(manga.value.id));
    await refresh(true);
    loading.value = false;
};

const reset = async () => {
    if (!currentUser.value || !manga.value) return;

    loading.value = true;
    await toPromise(resetProgress(manga.value.id));
    await refresh(true);
    loading.value = false;
}

const reloadSource = async () => {
    if (!currentUser.value || !manga.value) return;

    loading.value = true;
    await toPromise(reload(manga.value));
    await refresh(true);
    loading.value = false;
}

const copyUrl = () => {
    const baseUrl = `${window.location.protocol}//${window.location.host}/manga/${manga.value?.id}`;
    navigator.clipboard.writeText(baseUrl);
}

const toggleReadAll = async () => {
    if (!manga.value || !currentUser.value) return;

    loading.value = true;
    await toPromise(markAsRead(manga.value.id));
    await refresh(true);
    loading.value = false;
}
</script>

<style scoped lang="scss">
.progress-options > .flex:first-child { margin-top: 0; }

.button-list {
    .btn {
        border-radius: 0;

        &:first-child {
            border-top-left-radius: var(--brd-radius);
            border-top-right-radius: var(--brd-radius);
        }

        &:last-child {
            border-bottom-left-radius: var(--brd-radius);
            border-bottom-right-radius: var(--brd-radius);
        }
    }
}
</style>
