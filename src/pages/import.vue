<template>
<Loading v-if="loading" />
<Error v-else-if="error" :message="error.message" />
<div v-else class="center rounded bg-accent pad flex row import">
    <h2>Don't see your favourite manga? Add it!</h2>
    <div class="control fill">
        <label>Manga URL</label>
        <input type="url" placeholder="Manga Home Page URL" v-model="url" />
    </div>
    <p>We support Manga from the following sites:</p>
    <ul>
        <li v-for="prov in providers">
            <a :href="prov.url" target="_blank">{{ prov.name }}</a>
            {{ prov.name === 'nhentai' ? '(Yes, really...)' : '' }}
        </li>
    </ul>
    <footer class="flex">
        <IconBtn icon="add" pad-left @click="addManga"  />
    </footer>
</div>
</template>

<script setup lang="ts">
import { FetchError } from 'ofetch';
const { toPromise } = useApiHelper();
const route = useRoute();

useHead({ title: 'Import your favourite binge!' });

const url = ref('');
const routeUrl = computed(() => decodeURIComponent(route.query.url?.toString() ?? ''));
const loading = ref(false);
const error = ref<undefined | FetchError<any>>();
const { reload, providers: getProviders } = useMangaApi();

const { data: providers } = await getProviders();

const addManga = async () => {
    if (!url.value) return;

    loading.value = true;
    const data = await toPromise(reload(url.value, false), true);
    loading.value = false;

    if (data?.manga.id) {
        navigateTo(`/manga/${data.manga.id}`);
    }
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