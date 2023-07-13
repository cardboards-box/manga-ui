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
const route = useRoute();
const { reverseFile, reverseUrl } = useMangaApi();
const { toPromise, proxy } = useApiHelper();

const stuck = ref(false);
const url = computed(() => decodeURIComponent(route.params.url?.toString() ?? ''));
const search = ref(url.value);
const { pending, data: results } = await reverseUrl(url.value, process.client);
const combined = computed(() => 
    results.value 
        ? [...results.value.match, ...results.value.vision, ...results.value.textual] 
        : []);
const first = computed(() => combined.value[0]);

const title = computed(() => 
    first.value?.manga?.title 
    ?? 'Reverse Image Search');
const description = computed(() => 
    first.value?.manga.description 
    ?? 'Reverse Image search Manga pages to find the manga source.');
const cover = computed(() => 
    first.value?.manga.cover 
        ? proxy(first.value.manga.cover, 'manga-cover') 
        : 'https://manga.index-0.com/logo.png');

const searchFile = async (file: File) => {
    results.value = null;
    pending.value = true;
    results.value = (await toPromise(reverseFile(file), true)) ?? null;
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
</script>