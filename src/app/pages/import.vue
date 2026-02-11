<template>
<Loading v-if="loading" />
<Error v-else-if="!canRead || error" :message="error ?? 'Not found!'" />
<div v-else class="center rounded bg-accent pad flex row import">
    <h2>Don't see your favourite manga? Add it!</h2>
    <div class="control fill">
        <label>Manga URL</label>
        <input type="url" placeholder="Manga Home Page URL" v-model="url" />
    </div>
    <p>We support Manga from the following sites:</p>
    <ul>
        <li v-for="prov in sources" :key="prov.slug">
            <a :href="prov.baseUrl" target="_blank">{{ prov.name }}</a>
            {{ prov.slug === 'nhentai' ? '(Yes, really...)' : '' }}
        </li>
    </ul>
    <footer class="flex">
        <IconBtn icon="add" pad-left @click="addManga"  />
    </footer>
</div>
</template>

<script setup lang="ts">
const api = useMangaApi();
const route = useRoute();
const { canRead } = useAuthHelper();

useHead({ title: 'Import your favourite binge!' });

const url = ref('');
const routeUrl = computed(() => decodeURIComponent(route.query.url?.toString() ?? ''));
const loading = ref(false);
const error = ref<string>();
const cache = useCacheHelper();

const { data: cached } = useAsyncData(async () => await cache.get());
const sources = computed(() => cached.value?.sources ?? []);

const addManga = async () => {
    if (!url.value) return;

    loading.value = true;
    const result = await api.promise.manga.load(url.value);
    loading.value = false;
    if (!api.isSuccess(result)) {
        error.value = api.errorMessage(result);
        return;
    }

    const manga = api.data(result);
    if (!manga) {
        error.value = 'Failed to load manga.';
        return;
    }

    navigateTo(`/manga/${manga.id}`);
};

onMounted(() => nextTick(() => {
    if (!routeUrl.value) return;

    url.value = routeUrl.value;
    addManga();
}));

</script>

<style lang="scss" scoped>
.import {
    p { margin-top: 10px; }
    a { text-decoration: underline; }
}
</style>
