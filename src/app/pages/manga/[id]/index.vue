<template>
    <Loading v-if="loading" />
    <Error v-else-if="error || !manga || !fullManga" :message="error ?? 'Manga Not Found!'" />
    <main v-else class="new-manga-home scroll-y">
        <NewHomeHero
            :manga="manga"
            :full-manga="fullManga"
            :extended="extended"
            :cover="cover"
            :source="source"
            :tags="tags"
            :people="people"
            :volumes="volumes"
        />

        <NewHomeTabNav v-model="tab" :admin="isAdmin" />

        <div class="new-home-content">
            <NewHomeChaptersTab
                v-show="tab === 'chapters'"
                :volumes="volumes"
                :cover="cover"
                :covers="covers"
            />

            <NewHomeInfoTab
                v-show="tab === 'info'"
                :manga="manga"
                :extended="extended"
                :source="source"
                :tags="tags"
                :people="people"
            />

            <NewHomeCoversTab
                v-show="tab === 'covers'"
                :covers="covers"
            />

            <div v-show="tab === 'recommended'" class="recommendations-tab">
                <ClientOnly>
                    <RecommendationList
                        :title="`Manga Similar to: ${title}`"
                        :id="manga.id"
                    />
                </ClientOnly>
            </div>

            <NewHomeAdminTab
                v-if="isAdmin"
                v-show="tab === 'admin'"
                :manga="manga"
                :volumes="volumes"
                :covers="covers"
            />
        </div>
    </main>
</template>

<script setup lang="ts">
import NewHomeHero from '~/components/manga/new-home-page/Hero.vue';
import NewHomeTabNav from '~/components/manga/new-home-page/TabNav.vue';
import type { NewHomeTab } from '~/components/manga/new-home-page/TabNav.vue';
import NewHomeInfoTab from '~/components/manga/new-home-page/InfoTab.vue';
import NewHomeCoversTab from '~/components/manga/new-home-page/CoversTab.vue';
import NewHomeChaptersTab from '~/components/manga/new-home-page/ChaptersTab.vue';
import NewHomeAdminTab from '~/components/manga/new-home-page/AdminTab.vue';

const route = useRoute();
const { canRead, isAdmin } = useAuthHelper();
const { wrapUrl, apiUrl } = useSettingsHelper();
const {
    refresh,
    fullManga,
    manga,
    extended,
    source,
    tags,
    people,
    error,
    volumes,
    cover,
    covers,
    pending,
    throttled
} = useCurrentManga();

const tab = ref<NewHomeTab>('chapters');
const { pending: nuxtPending } = useAsyncData(
    `manga-${route.params.id}-new-fetch`,
    async () => await refresh(),
    { watch: [() => route.params, () => route.query] }
);

const loading = computed(() => nuxtPending.value || pending.value);
const title = computed(() => extended.value?.displayTitle ?? manga.value?.title ?? 'Manga Not Found!');
const description = computed(() => manga.value?.description ?? 'Find your next binge on MangaBox!');
const coverImage = computed(() => cover.value ? wrapUrl(apiUrl, cover.value.url) : 'https://mangabox.app/broken.png');

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
watch(isAdmin, () => {
    if (!isAdmin.value && tab.value === 'admin') tab.value = 'chapters';
});

onMounted(() => setTimeout(() => nextTick(() => {
    if (!canRead.value || (!error.value && manga.value)) return;
    refresh(true);
}), 200));
</script>

<style scoped lang="scss">
.new-manga-home {
    width: 100%;
    height: 100%;
    background: var(--bg-color);

    .new-home-content {
        width: min(1180px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 1.5rem 0 4rem;
    }

    .recommendations-tab {
        max-width: 100%;
    }
}
</style>
