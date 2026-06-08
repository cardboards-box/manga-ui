<template>
    <Error v-if="!isAdmin" message="Image administration is not available." />
    <Loading v-else-if="isLoading" />
    <main v-else class="chapter-image-admin max-width scroll-y">
        <header class="admin-header">
            <div>
                <p>{{ mangaTitle }}</p>
                <h1>{{ currentChapterTitle }}</h1>
            </div>
            <div class="admin-actions">
                <IconBtn
                    icon="arrow_back"
                    text="Back to Chapter"
                    color="shade"
                    :link="`/chapter/${chapterId}`"
                />
                <IconBtn
                    icon="sync"
                    text="Refresh"
                    color="shade"
                    :loading="refreshing"
                    @click="refresh"
                />
            </div>
        </header>

        <Error v-if="error" :message="error" />
        <section v-else class="admin-panel">
            <div class="panel-heading">
                <div>
                    <h2>Chapter Images</h2>
                    <p>{{ pages.length }} image{{ pages.length === 1 ? '' : 's' }}</p>
                </div>
            </div>

            <p v-if="!pages.length" class="empty">No images found for this chapter.</p>
            <div v-else class="admin-image-grid">
                <article
                    v-for="image in pages"
                    :key="image.id"
                    class="admin-image"
                >
                    <a
                        class="image-preview"
                        :href="api.promise.image.downloadUrl(image)"
                        target="_blank"
                    >
                        <img :src="api.promise.image.downloadUrl(image)" :alt="imageLabel(image)" />
                    </a>
                    <div class="image-info">
                        <div class="image-title">
                            <strong>{{ imageLabel(image) }}</strong>
                            <span>{{ image.mimeType ?? 'Unknown type' }}</span>
                        </div>
                        <dl>
                            <div>
                                <dt>ID</dt>
                                <dd :title="image.id">{{ image.id }}</dd>
                            </div>
                            <div v-if="image.fileName">
                                <dt>File</dt>
                                <dd :title="image.fileName">{{ image.fileName }}</dd>
                            </div>
                            <div>
                                <dt>Size</dt>
                                <dd>{{ imageDimensions(image) }}</dd>
                            </div>
                            <div v-if="image.imageSize">
                                <dt>Bytes</dt>
                                <dd>{{ formatBytes(image.imageSize) }}</dd>
                            </div>
                        </dl>
                    </div>
                    <div class="image-actions">
                        <IconBtn
                            icon="open_in_new"
                            title="Open image"
                            color="shade"
                            inline
                            :link="api.promise.image.downloadUrl(image)"
                            external
                        />
                        <IconBtn
                            icon="delete"
                            title="Delete image"
                            color="danger"
                            inline
                            :loading="deleting[image.id]"
                            @click="deleteImage(image)"
                        />
                    </div>
                </article>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import type { MbImage, MbTypeChapter } from '~/models';

const route = useRoute();
const api = useMangaApi();
const { isAdmin } = useAuthHelper();
const { getRelated, getRelateds, chapterTitle } = useMangaUtils();

const chapterData = ref<MbTypeChapter>();
const pages = ref<MbImage[]>([]);
const error = ref<string>();
const refreshing = ref(false);
const deleting = ref<Record<string, boolean>>({});

const chapterId = computed(() => route.params.id?.toString() ?? '');
const chapter = computed(() => chapterData.value?.entity);
const manga = computed(() => chapterData.value ? getRelated(chapterData.value, 'MbManga') : undefined);
const mangaTitle = computed(() => manga.value?.title ?? 'Unknown Manga');
const currentChapterTitle = computed(() => chapter.value ? chapterTitle(chapter.value) : 'Chapter Images');

const { pending } = useAsyncData(
    `chapter-${chapterId.value}-images-admin`,
    async () => {
        await loadChapter();
        return true;
    },
    { watch: [chapterId, isAdmin] }
);

const isLoading = computed(() => pending.value || refreshing.value);

useHead({
    title: computed(() => `${currentChapterTitle.value} - Image Admin`)
});

async function loadChapter(refetch = false) {
    if (!isAdmin.value || !chapterId.value) return;

    error.value = undefined;
    const res = await api.promise.chapter.fetch(chapterId.value, refetch);
    if (!api.isSuccess(res)) {
        chapterData.value = undefined;
        pages.value = [];
        error.value = `Failed to load chapter images. ${api.errorMessage(res)}`;
        return;
    }

    const data = api.data(res);
    chapterData.value = data;
    pages.value = data ? getRelateds(data, 'MbImage').toSorted((a, b) => a.ordinal - b.ordinal) : [];
}

async function refresh() {
    refreshing.value = true;
    await loadChapter(true);
    refreshing.value = false;
}

async function deleteImage(image: MbImage) {
    deleting.value = { ...deleting.value, [image.id]: true };
    const res = await api.promise.image.del(image.id);
    deleting.value = { ...deleting.value, [image.id]: false };

    if (!api.isSuccess(res)) {
        error.value = `Failed to delete image ${image.id}. ${api.errorMessage(res)}`;
        return;
    }

    pages.value = pages.value.filter(page => page.id !== image.id);
}

function imageLabel(image: MbImage) {
    return `Page ${image.ordinal}`;
}

function imageDimensions(image: MbImage) {
    if (!image.imageWidth || !image.imageHeight) return 'Unknown';
    return `${image.imageWidth} x ${image.imageHeight}`;
}

function formatBytes(size: number) {
    if (size < 1024) return `${size} B`;

    const units = ['KB', 'MB', 'GB'];
    let value = size / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
</script>

<style scoped lang="scss">
.chapter-image-admin {
    display: grid;
    gap: 1rem;
    padding: 1rem;
}

.admin-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1rem;
    align-items: center;

    h1 {
        margin: 0;
        overflow: hidden;
        color: var(--color);
        font-size: 1.6rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    p {
        margin: 0 0 .25rem;
        overflow: hidden;
        color: var(--color-muted-light);
        font-size: .85rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.admin-panel {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;
    background: rgba(255, 255, 255, .035);
}

.panel-heading {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: .75rem;

    h2 {
        margin: 0;
        color: var(--color-muted-light);
        font-size: .78rem;
        text-transform: uppercase;
        letter-spacing: 0;
    }

    p {
        margin: .25rem 0 0;
        color: var(--color-muted-light);
        font-size: .82rem;
    }
}

.admin-actions,
.image-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
}

.admin-image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: .75rem;
}

.admin-image {
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    border-radius: 8px;
    background: var(--bg-color-accent);
}

.image-preview {
    display: block;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    background: var(--bg-color-accent-dark);

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}

.image-info {
    display: grid;
    gap: .65rem;
    padding: .75rem;
}

.image-title {
    display: grid;
    gap: .15rem;
    min-width: 0;

    strong,
    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    span {
        color: var(--color-muted-light);
        font-size: .78rem;
    }
}

dl {
    display: grid;
    gap: .35rem;
    margin: 0;

    div {
        display: grid;
        grid-template-columns: 3.5rem minmax(0, 1fr);
        gap: .45rem;
    }
}

dt {
    color: var(--color-muted-light);
    font-size: .72rem;
}

dd {
    margin: 0;
    overflow: hidden;
    font-size: .76rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.image-actions {
    position: absolute;
    top: .5rem;
    right: .5rem;
}

.empty {
    margin: 0;
    color: var(--color-muted-light);
}

@media only screen and (max-width: 720px) {
    .admin-header {
        grid-template-columns: 1fr;
    }
}
</style>
