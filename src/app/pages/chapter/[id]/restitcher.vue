<template>
    <Error v-if="!canRead || !id" message="Restitcher not available" />
    <ChapterRestitcher v-else :chapter="id" />
</template>

<script lang="ts" setup>
const route = useRoute();
const { canRead } = useAuthHelper();
const id = computed(() => route.params.id?.toString());
</script>
