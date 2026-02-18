<template>
    <Loading v-if="pending" />
    <Error v-else-if="error" :message="error" />
    <CardList
        v-else
        title="Here are some manga based on your read-history!"
        :manga="manga"
        capitalize
        allow-reload
        @reload="() => refresh()"
        :content-ratings="contentRatings"
    />
</template>

<script lang="ts" setup>
const api = useMangaApi();
const cache = useCacheHelper();
const { recommendations } = useMangaUtils();

useHead({ title: 'Find your next binge!' });

if (import.meta.server) useSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
})

const {
    pending,
    data: apiData,
    error: apiError,
    refresh
} = useAsyncData(async () => await recommendations());
const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);

const error = computed(() => {
    if (api.isSuccess(apiData.value)) return undefined;
    if (apiError.value) return api.errorMessage(<any>apiError.value.data);
    return api.errorMessage(apiData.value) ?? 'An unknown error occurred!';
});

const manga = computed(() => apiData.value ? api.data(apiData.value) ?? [] : []);

</script>
