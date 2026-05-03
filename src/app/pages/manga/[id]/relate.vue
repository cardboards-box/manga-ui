<template>
    <Loading v-if="loading" />
    <Error v-else-if="error || !fullManga" :message="error ?? 'Manga not found!'" />
    <div class="max-width" v-else>
        <ClientOnly>
            <Tabs>
                <Tab title="Add Relation" icon="add" scrollable keep-alive>
                    <MangaSearch
                        :pending="relatedMangaLoading"
                        title="Search for manga to relate"
                    >
                        <template #card-title="{ manga }">
                            <IconBtn
                                v-if="isAdmin"
                                icon="add"
                                color="primary"
                                :title="'Relate ' + manga.entity.title"
                                @click="relate(manga)"
                            />
                        </template>
                    </MangaSearch>
                </Tab>
                <Tab title="Current Relations" icon="family_history" scrollable keep-alive>
                    <h3>Current Manga:</h3>
                    <MangaCard
                        :manga="fullManga"
                        :content-ratings="contentRatings"
                    />
                    <h3>Related Manga: </h3>
                    <MangaCard
                        v-for="related in relatedMangaValues"
                        :key="related.entity.id"
                        :manga="related"
                        :content-ratings="contentRatings"
                    >
                        <template #title>
                            <IconBtn
                                v-if="isAdmin"
                                icon="close"
                                color="danger"
                                :title="'Unrelate ' + related.entity.title"
                                @click="unrelate(related)"
                            />
                        </template>
                    </MangaCard>
                </Tab>
            </Tabs>
        </ClientOnly>
    </div>
</template>

<script lang="ts" setup>
import type { MbTypeMangaSearch, MbTypeManga } from '~/models';

const route = useRoute();
const api = useMangaApi();
const { canRead, isAdmin } = useAuthHelper();
const { wrapUrl, apiUrl } = useSettingsHelper();
const cache = useCacheHelper();

const {
    refresh, manga, extended, fullManga,
    error: mangaError, cover,
    pending, throttled, relatedManga
} = useCurrentManga();
const { pending: nuxtPending } = useAsyncData(
    `manga-${route.params.id}-fetch`,
    async () => await refresh(), {
    watch: [() => route.params, () => route.query]
});
const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);

const rawLoading = ref(false);
const title = computed(() => extended.value?.displayTitle ?? manga.value?.title ?? 'Manga Not Found!');
const description = computed(() => manga.value?.description ?? 'Find your next binge on MangaBox!');
const coverImage = computed(() => cover.value ? wrapUrl(apiUrl, cover.value?.url) : 'https://mangabox.app/broken.png');

const relatedMangaValues = ref<MbTypeMangaSearch[]>([]);
const relatedMangaLoading = ref(false);
const relatedMangaError = ref<string>();
const loading = computed(() => nuxtPending.value || pending.value || rawLoading.value || relatedMangaLoading.value);

const error = computed(() => {
    if (mangaError.value) return mangaError.value;
    if (relatedMangaError.value) return relatedMangaError.value;
    return undefined;
});

useHead({ title });

if (import.meta.server) useSeoMeta({
    title,
    description,
    ogImage: coverImage,
    twitterCard: 'summary_large_image'
});


const loadRelated = async () => {
    if (!relatedManga.value) return;

    relatedMangaLoading.value = true;
    relatedMangaError.value = undefined;

    try {
        const related = relatedManga.value.map(r => r.mangaId);
        const result = await api.promise.manga.search({ ids: related });
        if (!api.isSuccess(result))
            throw new Error(api.errorMessage(result) ?? 'Failed to load related manga!');

        const relatedData = api.data(result);
        relatedMangaValues.value = relatedData.data ?? [];
    } catch (e) {
        relatedMangaError.value = e?.toString();
    } finally {
        relatedMangaLoading.value = false;
    }
}


const relate = async (related: MbTypeMangaSearch | MbTypeManga) => {
    try {
        relatedMangaLoading.value = true;
        const result = await api.promise.manga.relate(manga.value!.id, related.entity.id);
        if (!api.isSuccess(result))
            throw new Error(api.errorMessage(result) ?? 'Failed to relate manga!');

        await refresh();
        await loadRelated();
    } catch (ex) {
        relatedMangaError.value = ex?.toString();
    } finally {
        relatedMangaLoading.value = false;
    }
}

const unrelate = async (related: MbTypeMangaSearch) => {
    try {
        relatedMangaLoading.value = true;
        const result = await api.promise.manga.unrelate(manga.value!.id, related.entity.id);
        if (!api.isSuccess(result))
            throw new Error(api.errorMessage(result) ?? 'Failed to unrelate manga!');

        await refresh();
        await loadRelated();
    } catch (ex) {
        relatedMangaError.value = ex?.toString();
    } finally {
        relatedMangaLoading.value = false;
    }
}

watch(() => route.params.id, () => throttled(false));
watch(() => route.query.asc, () => throttled(false));
watch(() => route.query.sort, () => throttled(false));
watch(() => relatedManga.value, () => loadRelated(), { immediate: true, deep: true });
watch(canRead, () => throttled(false));

onMounted(() => setTimeout(() => nextTick(() => {
    if (!canRead.value || (!error.value && manga.value)) return;
    refresh(true);
}), 200));
</script>

<style lang="scss" scoped>

</style>
