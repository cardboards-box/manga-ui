<template>
<CardList 
    title="Reverse Image Lookup"
    :search="combined"
    :pending="pending"
    :noresults="!!results"
    @headerstuck="(v) => stuck = v"
>
    <ReverseSearch 
        v-model="search"
        @file="searchFile"
        :stuck="stuck"
    />
</CardList>
</template>

<script setup lang="ts">
import { ImageSearch } from '~/models';

const route = useRoute();

const url = computed(() => route.query.url?.toString() ?? '');

const { reverseFile, reverseUrl } = useMangaApi();
const { toPromise, proxy } = useApiHelper();
const search = ref('');
const pending = ref(false);
const stuck = ref(false);
const results = ref<ImageSearch | undefined>();
const combined = computed(() => 
    results.value 
        ? [
            ...results.value.match, 
            ...results.value.vision, 
            ...results.value.textual
        ] : []);

const first = computed(() => combined.value[0]);

const title = computed(() =>  first.value?.manga?.title ?? 'Reverse Image Search');
const description = computed(() => 
    first.value?.manga.description 
    ?? 'Reverse Image search Manga pages to find the manga source.');
const cover = computed(() => 
    first.value?.manga.cover 
        ? proxy(first.value.manga.cover, 'manga-cover') 
        : 'https://manga.index-0.com/logo.png');

const searchFile = async (file: File) => {
    pending.value = true;
    results.value = undefined;
    results.value = await toPromise(reverseFile(file), true);
    pending.value = false;
};

const searchUrl = async () => {
    if (!url.value) return;

    pending.value = true;
    results.value = undefined;
    results.value = await toPromise(reverseUrl(url.value, true));
    pending.value = false;
}

useHead({ title });

useServerSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage: cover,
    twitterCard: 'summary_large_image'
});

onMounted(() => nextTick(() => {
    searchUrl();
}));

watch(() => url.value, () => searchUrl());
</script>