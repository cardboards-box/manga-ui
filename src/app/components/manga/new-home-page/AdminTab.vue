<template>
    <section class="admin-tab">
        <div class="admin-panel">
            <h2>Title</h2>
            <div class="title-tools">
                <label>
                    <span>Select a Title</span>
                    <SelectBox v-model="selectedTitle" fill>
                        <option :value="manga.title">{{ manga.title }} (Main Title)</option>
                        <option v-for="alt in manga.altTitles" :key="alt" :value="alt">{{ alt }} (Alt Title)</option>
                    </SelectBox>
                </label>
                <label>
                    <span>Custom Title</span>
                    <input v-model="selectedTitle" />
                </label>
            </div>
            <p>Leave blank to use the original title.</p>
            <div class="admin-actions">
                <IconBtn
                    icon="save"
                    text="Save Title"
                    color="primary"
                    :loading="loading"
                    @click="saveTitle"
                />
                <IconBtn
                    icon="sync"
                    text="Reload From Source"
                    color="shade"
                    :loading="partialLoading"
                    @click="forceRefresh"
                />
                <IconBtn
                    icon="family_history"
                    text="Manage Related Manga"
                    color="shade"
                    :link="`/manga/${manga.id}/relate`"
                />
            </div>
        </div>

        <div class="admin-panel">
            <h2>Chapters</h2>
            <div class="admin-actions" v-if="selectedChapters.length">
                <IconBtn
                    icon="delete"
                    :text="`Delete ${selectedChapters.length} Selected`"
                    color="danger"
                    :loading="loading"
                    @click="massSoftDelete"
                />
                <IconBtn
                    icon="check_box_outline_blank"
                    text="Clear Selection"
                    color="shade"
                    @click="selectedChapters = []"
                />
            </div>

            <div class="admin-chapter-list">
                <div
                    v-for="chapter in chapterRows"
                    :key="chapter.chapter.id"
                    class="admin-chapter-row"
                >
                    <NuxtLink :to="`/chapter/${chapter.chapter.id}`">{{ chapterTitle(chapter.chapter) }}</NuxtLink>
                    <div>
                        <IconBtn
                            :icon="selectedChapters.includes(chapter.chapter.id) ? 'check_box' : 'check_box_outline_blank'"
                            color="shade"
                            title="Select chapter"
                            inline
                            @click="toggleChapter(chapter.chapter.id)"
                        />
                        <IconBtn
                            icon="split_scene"
                            :link="`/chapter/${chapter.chapter.id}/restitcher`"
                            title="Restitch chapter"
                            color="shade"
                            inline
                        />
                        <IconBtn
                            icon="delete"
                            color="danger"
                            title="Delete chapter"
                            :loading="loading"
                            inline
                            @click="softDelete(chapter)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="admin-panel">
            <h2>Covers</h2>
            <div class="admin-cover-grid">
                <div
                    v-for="cover in covers"
                    :key="cover.id"
                    class="admin-cover"
                >
                    <Cover :image="cover" type="background" width="100%" height="100%" />
                    <IconBtn
                        icon="delete"
                        color="danger"
                        title="Delete Cover"
                        :loading="loading"
                        @click="deleteCover(cover)"
                    />
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { MangaVolumes, MbImage, MbManga, ProgressChapter } from '~/models';

const api = useMangaApi();
const { chapterTitle } = useMangaUtils();
const { partialLoading, forceRefresh, throttled } = useCurrentManga();

const props = defineProps<{
    manga: MbManga;
    volumes?: MangaVolumes;
    covers: MbImage[];
}>();

const loading = ref(false);
const selectedTitle = ref('');
const selectedChapters = ref<string[]>([]);

const chapterRows = computed(() => Object.values(props.volumes?.chapters ?? {})
    .toSorted((a, b) => {
        const volume = (a.chapter.volume ?? 0) - (b.chapter.volume ?? 0);
        return volume || a.chapter.ordinal - b.chapter.ordinal;
    }));

const toggleChapter = (id: string) => {
    selectedChapters.value = selectedChapters.value.includes(id)
        ? selectedChapters.value.filter(chapterId => chapterId !== id)
        : [...selectedChapters.value, id];
};

const saveTitle = async () => {
    loading.value = true;
    const title = selectedTitle.value.trim();
    await api.promise.manga.displayTitle(props.manga.id, title);
    loading.value = false;
    throttled(true);
};

const softDelete = async (chapter: ProgressChapter) => {
    loading.value = true;
    await api.promise.chapter.delete(chapter.chapter.id);
    loading.value = false;
    throttled(true);
};

const massSoftDelete = async () => {
    if (!selectedChapters.value.length) return;

    loading.value = true;
    await Promise.all(selectedChapters.value.map(id => api.promise.chapter.delete(id)));
    selectedChapters.value = [];
    loading.value = false;
    throttled(true);
};

const deleteCover = async (cover: MbImage) => {
    loading.value = true;
    await api.promise.image.del(cover.id);
    loading.value = false;
    throttled(true);
};
</script>

<style scoped lang="scss">
.admin-tab {
    display: grid;
    gap: 1rem;
}

.admin-panel {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;
    background: rgba(255, 255, 255, .035);

    h2 {
        margin-bottom: .75rem;
        color: var(--color-muted-light);
        font-size: .78rem;
        text-transform: uppercase;
        letter-spacing: 0;
    }

    p {
        margin-top: .65rem;
        color: var(--color-muted-light);
        font-size: .82rem;
    }
}

.title-tools {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .75rem;

    label {
        display: grid;
        gap: .35rem;
        min-width: 0;
    }

    span {
        color: var(--color-muted-light);
        font-size: .75rem;
    }
}

.admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin-top: .9rem;
}

.admin-chapter-list {
    display: grid;
    gap: .35rem;
    max-height: 560px;
    overflow-y: auto;
}

.admin-chapter-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: .75rem;
    align-items: center;
    min-height: 38px;
    padding: .45rem .6rem;
    border-radius: var(--brd-radius);
    background: var(--bg-color-accent);

    a {
        overflow: hidden;
        color: var(--color);
        text-overflow: ellipsis;
        white-space: nowrap;
        text-decoration: none;
    }

    > div {
        display: flex;
        gap: .55rem;
        align-items: center;
    }
}

.admin-cover-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: .75rem;
}

.admin-cover {
    position: relative;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    border-radius: 8px;
    background: var(--bg-color-accent);

    > .btn {
        position: absolute;
        top: .5rem;
        right: .5rem;
    }
}

@media only screen and (max-width: 720px) {
    .title-tools,
    .admin-chapter-row {
        grid-template-columns: 1fr;
    }
}
</style>
