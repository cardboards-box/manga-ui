<template>
    <Loading v-if="loading" />
    <Error v-else-if="error || !manga" :message="error ?? 'Manga Not Found!'" />
    <div v-else class="manga-details flex fill-parent scroll-y">
        <div class="manga-offset-width flex row">
            <div class="manga-header flex row center-horz margin-top">
                <Cover :image="cover" type="background" width="100%" height="400px" />
                <NuxtLink class="title" :to="`/manga/${manga.id}`">{{ title }}</NuxtLink>
            </div>
            <div class="title-select margin flex row rounded">
                <div class="flex margin-top">
                    <label class="flex center-vert margin-right">Select a Title: </label>
                    <SelectBox
                        v-model="selectedTitle"
                        fill
                    >
                        <option :value="manga.title">{{ manga.title }} (Main Title)</option>
                        <option v-for="alt in manga.altTitles" :key="alt" :value="alt">{{ alt }} (Alt Title)</option>
                    </SelectBox>
                </div>
                <div class="alt flex margin-top">
                    <label class="flex center-vert margin-right">Or Input a custom one: </label>
                    <input class="fill" v-model="selectedTitle" />
                </div>
                <p class="alt flex margin-top pad-left mute-light">Leave blank to use the original title.</p>
                <div class="margin-top pad-left">
                    <IconBtn
                        icon="save"
                        text="Save Title"
                        color="primary"
                        @click="saveTitle"
                    />
                </div>
            </div>
            <div class="margin flex row rounded" v-if="selectedChapters.length > 0">
                <div class="flex pad-left">
                    <IconBtn
                        icon="save"
                        text="Mass Delete Chapters"
                        color="danger"
                        @click="massSoftDelete"
                        other-classes="margin-left"
                    />
                </div>
            </div>

            <div class="margin flex row">
                <VolumeList
                    v-if="canRead && volumes"
                    :volumes="volumes"
                    :manga="manga"
                    :sort="params?.sort ?? ChapterOrderBy.Ordinal"
                    :asc="params?.asc ?? true"
                    v-slot="{ chapter }"
                    has-slot="true"
                >
                    <IconBtn
                        class="cell margin-right"
                        icon="delete"
                        color="danger"
                        inline
                        @click="softDelete(chapter)"
                    />
                    <IconBtn
                        class="cell margin-right"
                        :icon="selectedChapters.includes(chapter.chapter.id) ? 'check_box' : 'check_box_outline_blank'"
                        color="primary"
                        inline
                        @click="() => {
                            selectedChapters.includes(chapter.chapter.id)
                                ? selectedChapters = selectedChapters.filter(id => id !== chapter.chapter.id)
                                : selectedChapters.push(chapter.chapter.id);
                        }"
                    />
                </VolumeList>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ChapterOrderBy } from '~/models';
import type { ProgressChapter } from '~/models';

const route = useRoute();
const { canRead } = useAuthHelper();
const { wrapUrl, apiUrl } = useSettingsHelper();
const api = useMangaApi();

const {
    refresh, manga, extended,
    error, volumes, cover,
    pending, throttled, params,
} = useCurrentManga();
const { pending: nuxtPending } = useAsyncData(async () => await refresh());

const loading = computed(() => nuxtPending.value || pending.value || rawLoading.value);
const title = computed(() => extended.value?.displayTitle ?? manga.value?.title ?? 'Manga Not Found!');
const description = computed(() => manga.value?.description ?? 'Find your next binge on MangaBox!');
const coverImage = computed(() => cover.value ? wrapUrl(apiUrl, cover.value?.url) : 'https://mangabox.app/broken.png');

const selectedTitle = ref('');
const rawLoading = ref(false);
const selectedChapters = ref<string[]>([]);

useHead({ title });

if (import.meta.server) useSeoMeta({
    title,
    description,
    ogImage: coverImage,
    twitterCard: 'summary_large_image'
});

watch(() => route.params.id, () => throttled(false));
watch(() => route.query.asc, () => throttled(false));
watch(() => route.query.sort, () => throttled(false));
watch(canRead, () => throttled(false));

onMounted(() => setTimeout(() => nextTick(() => {
    if (!canRead.value || (!error.value && manga.value)) return;
    refresh(true);
}), 200));

const saveTitle = async () => {
    if (!manga.value) return;
    rawLoading.value = true;

    const title = selectedTitle.value.trim();
    await api.promise.manga.displayTitle(manga.value.id, title);
    rawLoading.value = false;
    throttled(true);
}

const softDelete = async (chapter: ProgressChapter) => {
    if (!manga.value) return;
    rawLoading.value = true;

    await api.promise.chapter.delete(chapter.chapter.id);
    rawLoading.value = false;
    throttled(true);
}

const massSoftDelete = async () => {
    if (!manga.value || selectedChapters.value.length === 0) return;
    rawLoading.value = true;

    await Promise.all(selectedChapters.value.map(id => api.promise.chapter.delete(id)));
    selectedChapters.value = [];
    rawLoading.value = false;
    throttled(true);
}
</script>

<style lang="scss" scoped>
$bg-color: var(--bg-color-accent);

.manga-details {
    position: unset;

    .manga-offset-width {
        flex: 1;
        max-width: 1450px;
        margin: 0 auto;
    }

    .manga-header {
        position: relative;
        width: 430px;
        height: auto;

        a.title {
            font-size: 2em;
            text-align: center;
            margin-top: 5px;
            max-width: 100%;
            word-break: break-word;
        }

        .buttons {
            flex-flow: row wrap;
            align-items: center;

            button,
            a {
                margin: 5px;

                p { display: none; }
            }
        }
    }

    .title-select {
        padding: var(--margin);
        background-color: $bg-color;
    }
}
</style>
