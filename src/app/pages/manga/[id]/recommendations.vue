<template>
    <Loading v-if="pending" />
    <Error v-else-if="error" :message="error" />
    <CardList v-else
        title="Recommended Manga"
        :manga="manga"
        capitalize
        allow-reload
        @reload="() => refresh()"
        :content-ratings="contentRatings"
    />

</template>

<script lang="ts" setup>

const api = useMangaApi();
const route = useRoute();
const cache = useCacheHelper();

useHead({ title: 'Find your next binge!' });

if (import.meta.server) useSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
})

const id = computed(() => route.params.id!.toString());
const {
    pending,
    data: apiData,
    error: apiError,
    refresh
} = api.nuxt.manga.recommendations(id.value);
const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);

const error = computed(() => {
    if (api.isSuccess(apiData.value)) return undefined;
    if (apiError.value) return api.errorMessage(apiError.value.data);
    return api.errorMessage(apiData.value) ?? 'An unknown error occurred!';
});

const manga = computed(() => apiData.value ? api.data(apiData.value) ?? [] : []);

</script>
