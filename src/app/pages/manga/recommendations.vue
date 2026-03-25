<template>
    <RecommendationList />
</template>

<script lang="ts" setup>
useHead({ title: 'Find your next binge!' });

if (import.meta.server) useSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
})
</script>
