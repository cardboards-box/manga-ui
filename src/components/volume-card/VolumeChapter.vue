<template>
<div class="one-chapter" v-if="rest.length === 0">
    <div class="progress" v-if="chapter.progress" :style="{ 'width': chapter.progress + '%' }">
        <span>{{ chapter.progress.toFixed(2) + '%' }}</span>
    </div>
    <div class="chapter">
        <VolumeCard 
            :chapter="first" 
            :progress="progress" 
            v-model="chapter.read" 
            :open="chapter.open" 
            @toggle-open="() => chapter.open = !chapter.open"
            :has-versions="false"
            :version="false"
        />
    </div>
</div>
<div class="more-chapters" v-else>
    <div class="progress" v-if="chapter.progress" :style="{ 'width': chapter.progress + '%' }">
        <span>{{ chapter.progress.toFixed(2) + '%' }}</span>
    </div>
    <div class="chapter">
        <VolumeCard 
            :chapter="first" 
            :progress="progress" 
            v-model="chapter.read"
            :open="chapter.open" 
            @toggle-open="() => chapter.open = !chapter.open"
            :has-versions="true"
            :version="false"
        />
        <template v-if="chapter.open">
            <VolumeCard 
                v-for="version in rest"
                :chapter="version" 
                :progress="progress" 
                :read="chapter.read" 
                :version="true"
                :has-versions="false"
                v-model="chapter.read"
            />
        </template>
    </div>
</div>

</template>

<script setup lang="ts">
import { MangaVolueChapter, Progress } from 'models';

const props = defineProps<{
    chapter: MangaVolueChapter;
    progress?: Progress;
}>();

const first = computed(() => props.chapter.versions[0]);
const rest = computed(() => props.chapter.versions.slice(1));
</script>

<style scoped lang="scss">
.one-chapter,
.more-chapters {
    position: relative;
    margin-bottom: 5px;
    border: 1px solid var(--color-muted);
    border-radius: var(--brd-radius);
    overflow: hidden;

    &:last-child {
        margin-bottom: 0;
    }
}

.progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: var(--bg-color-accent-dark);
    z-index: -1;
    border-radius: var(--brd-radius);

    span {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--accent-1);
        border-radius: 50%;
    }
}
</style>