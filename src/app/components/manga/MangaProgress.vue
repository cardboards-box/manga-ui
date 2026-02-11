<template>
    <Loading v-if="!manga" />
    <template v-else>
        <Drawer title="Actions" default-closed storage-key="manga-actions">
            <div class="button-list flex row">
                <IconBtn
                    v-if="canRead"
                    :loading="partialLoading"
                    :icon="favourited ? 'heart_minus' : 'favorite'"
                    :fill="favourited"
                    :text="favourited ? 'Unfavourite' : 'Favourite'"
                    color="shade"
                    @click="favourited = !favourited"
                />
                <IconBtn
                    v-if="canRead && (progress?.progressPercentage ?? 0) > 0"
                    :loading="partialLoading"
                    icon="delete"
                    text="Reset Progress"
                    color="shade"
                    @click="resetProgress"
                />
                <IconBtn
                    v-if="canRead"
                    :loading="partialLoading"
                    icon="visibility"
                    text="Mark all as Read"
                    color="shade"
                    @click="markAsRead"
                />
                <IconBtn
                    v-if="canRead"
                    :loading="partialLoading"
                    icon="sync"
                    text="Reload From Source"
                    color="shade"
                    @click="forceRefresh"
                />
                <IconBtn
                    icon="content_copy"
                    text="Copy Manga Url"
                    color="shade"
                    @click="copyUrl"
                />
                <IconBtn
                    v-if="isAdmin"
                    icon="edit"
                    text="Admin Edit"
                    color="shade"
                    :link="`/manga/${manga.id}/admin`"
                />
            </div>
        </Drawer>
        <Drawer title="Progress" v-if="canRead" storage-key="manga-progress">
            <div class="progress-options">
                <ProgressBar
                    :percent="stats?.total ?? 0"
                    icon="shelves"
                    label="Total Progress"
                    :side-label="stats?.totalSlug"
                />

                <ProgressBar
                    :percent="stats?.manga ?? 0"
                    icon="book_5"
                    label="Volumes Read"
                    :side-label="stats?.mangaSlug"
                />

                <ProgressBar
                    :percent="stats?.volume ?? 0"
                    icon="menu_book"
                    label="Volume Progress"
                    :side-label="stats?.volumeSlug"
                />

                <ProgressBar
                    :percent="stats?.chapter ?? 0"
                    icon="auto_stories"
                    label="Pages Read"
                    :side-label="stats?.chapterSlug"
                />

                <div class="flex margin-top">
                    <Icon class="margin-right">event</Icon>
                    <span class="fill center-vert">Last Opened</span>
                    <span v-if="!progress?.lastReadAt" class="center-vert">Never</span>
                    <Date v-else :date="progress.lastReadAt" format="r" utc class="center-vert" />
                </div>
            </div>
        </Drawer>
    </template>

</template>

<script setup lang="ts">
const { isAdmin, canRead } = useAuthHelper();
const { chapterTitle } = useMangaUtils();
const {
    manga, progress, favourited,
    resetProgress, markAsRead, partialLoading,
    forceRefresh, chapters,
    progressData: stats
} = useCurrentManga();

const chapter = computed(() => chapters.value.find(t => t.chapter.id === progress.value?.lastReadChapterId));
const chapProg = computed(() => chapter.value?.progress);
const link = computed(() => `/chapter/${chapter.value?.chapter.id}?page=${chapter.value?.progress?.pageOrdinal ?? 1}`);
const title = computed(() => chapter.value ? chapterTitle(chapter.value.chapter) : '');

const copyUrl = () => {
    const baseUrl = `${window.location.protocol}//${window.location.host}/manga/${manga.value?.id}`;
    navigator.clipboard.writeText(baseUrl);
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
