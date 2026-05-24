<template>
<div class="one-chapter" v-if="rest.length === 0 && partials.length === 0">
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
                :version="false"
                :has-versions="false"
                :has-slot="hasSlot"
                v-model="chapter.open"
            >
                <slot :chapter="version" />
            </VolumeCard>
            <template
                v-for="partial in partials"
                :key="partial.chapter.chapter.id"
            >
                <VolumeCard
                    :chapter="partial.chapter.chapter"
                    :progress="partial.chapter.progress"
                    :version="false"
                    :has-versions="partial.rest.length > 0"
                    :has-slot="hasSlot"
                    v-model="partial.partial.open"
                >
                    <slot :chapter="partial.chapter" />
                </VolumeCard>
                <template v-if="partial.partial.open">
                    <VolumeCard
                        v-for="version in partial.rest"
                        :chapter="version.chapter"
                        :progress="version.progress"
                        :version="true"
                        :has-versions="false"
                        :has-slot="hasSlot"
                        v-model="partial.partial.open"
                    >
                        <slot :chapter="version" />
                    </VolumeCard>
                </template>
            </template>
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

const fullChapters = computed(() => chapters.value.filter(t => [...props.chapter.whole, ...props.chapter.partial.flatMap(p => p.versions)].includes(t.chapter.id)));
const first = computed(() => fullChapters.value.find(t =>
    t.chapter.id === props.chapter.whole[0] ||
    t.chapter.id === props.chapter.partial[0]?.versions[0]));
const rest = computed(() => props.chapter.whole
    .filter(t => t !== first.value?.chapter.id)
    .map(t => fullChapters.value.find(c => c.chapter.id === t)!)
    .filter(t => !!t));
const partials = computed(() => props.chapter.partial
    .map(t => {
        const chapter = fullChapters.value.find(c => c.chapter.id === t.versions[0]);
        if (!chapter) return null;

        const rest = t.versions
            .filter(v => v !== chapter.chapter.id)
            .map(v => fullChapters.value.find(c => c.chapter.id === v))
            .filter(c => !!c);
        return {
            partial: t,
            chapter,
            rest
        }
    })
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
