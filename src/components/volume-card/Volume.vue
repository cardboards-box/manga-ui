<template>
<div class="volume-container" :class="{ 'collapse': volume.collapse }">
    <header class="flex" @click="toggle">
        <p class="fill">{{ volume.name ? 'Volume ' + volume.name : 'No Volume' }} - {{ volume.chapters.length }} Chapter{{ volume.chapters.length > 1 ? 's' : '' }}</p>
        <Icon>{{ !volume.collapse ? 'expand_less' : 'expand_more' }}</Icon>
    </header>
    <div class="volume-chapters">
        <VolumeChapter v-for="chapter in volume.chapters" :chapter="chapter" :progress="progress" />
    </div>
</div>
</template>

<script setup lang="ts">
import { MangaVolume, Progress } from 'models';

const props = defineProps<{
    volume: MangaVolume;
    index: number;
    progress?: Progress;
}>();

const toggle = () => props.volume.collapse = !props.volume.collapse;
</script>

<style scoped lang="scss">
.volume-container {
    display: flex;
    flex-flow: column;
    margin-top: 10px;
    margin: 10px 10px 0 10px;
    padding: 10px;
    position: relative;
    background-color: var(--bg-color-accent);
    border-radius: var(--brd-radius);

    header {
        cursor: pointer;

        p {
            margin: auto 5px;
        }
    }

    .collapse-btn {
        margin-left: auto;
    }

    .volume-chapters {
        display: flex;
        flex-flow: column;
        margin: 5px;
    }

    &.collapse {
        .volume-chapters {
            display: none;
        }
    }
}
</style>