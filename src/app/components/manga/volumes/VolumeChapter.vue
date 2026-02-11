<template>
<div class="one-chapter" v-if="rest.length === 0">
    <div class="progress" v-if="chapter.progress" :style="{ 'width': chapter.progress + '%' }">
        <span>{{ chapter.progress.toFixed(2) + '%' }}</span>
    </div>
    <div class="chapter" v-if="first">
        <VolumeCard
            :chapter="first.chapter"
            :progress="first.progress"
            v-model="chapter.open"
            :has-versions="false"
            :version="false"
            :has-slot="hasSlot"
        >
            <slot :chapter="first" />
        </VolumeCard>
    </div>
</div>
<div class="more-chapters" v-else>
    <div class="progress" v-if="chapter.progress" :style="{ 'width': chapter.progress + '%' }">
        <span>{{ chapter.progress.toFixed(2) + '%' }}</span>
    </div>
    <div class="chapter" v-if="first">
        <VolumeCard
            :chapter="first.chapter"
            :progress="first.progress"
            v-model="chapter.open"
            :has-versions="true"
            :version="false"
            :has-slot="hasSlot"
        >
            <slot :chapter="first" />
        </VolumeCard>
        <template v-if="chapter.open">
            <VolumeCard
                v-for="version in rest"
                :chapter="version.chapter"
                :progress="version.progress"
                :version="true"
                :has-versions="false"
                :has-slot="hasSlot"
                v-model="chapter.open"
            >
                <slot :chapter="version" />
            </VolumeCard>
        </template>
    </div>
</div>

</template>

<script setup lang="ts">
import type { VolumeChapter, booleanish } from '~/models';

const { chapters } = useCurrentManga();

const props = defineProps<{
    chapter: VolumeChapter;
    hasSlot?: booleanish;
}>();

const fullChapters = computed(() => chapters.value.filter(t => props.chapter.versions.includes(t.chapter.id)));
const first = computed(() => fullChapters.value.find(t => t.chapter.id === props.chapter.versions[0]));
const rest = computed(() => props.chapter.versions.slice(1)
    .map(t => fullChapters.value.find(c => c.chapter.id === t)!)
    .filter(t => !!t));
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
