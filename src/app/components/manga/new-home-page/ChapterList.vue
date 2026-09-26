<template>
    <div class="chapter-list-card">
        <ChapterRows
            :chapters="chapters"
            :chapter-map="volumes?.chapters"
            :reverse="reverse"
            :read-filter="readFilter"
        />
    </div>
</template>

<script setup lang="ts">
import { ChapterReadFilter } from '~/models';
import type { MangaVolumes } from '~/models';
import ChapterRows from './ChapterRows.vue';

const props = withDefaults(defineProps<{
    volumes?: MangaVolumes;
    reverse?: boolean;
    readFilter?: ChapterReadFilter;
}>(), {
    readFilter: ChapterReadFilter.All,
});

const chapters = computed(() => props.volumes?.volumes.flatMap(volume => volume.chapters) ?? []);
</script>

<style scoped lang="scss">
.chapter-list-card {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;
    background: rgba(255, 255, 255, .035);
}
</style>
