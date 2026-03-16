<template>
    <MangaSearch :state="state" />
</template>

<script setup lang="ts">
import { STATE_ROLLUP } from '~/models';

const route = useRoute();
const api = useMangaApi();

useHead({ title: 'Find your next binge!' });

if (import.meta.server) useSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
})

const state = computed(() => {
    const path = route.fullPath.toLowerCase().split('?')[0]!;
    return STATE_ROLLUP.find(s => s.routes === path);
});
</script>
