<template>


</template>

<script setup lang="ts">
import type { Progress, ProgressExt, Stats } from '~/models';

const { data } = useReaderHelper();

const props = defineProps<{
    manga?: ProgressExt;
    progress?: Progress;
    stats?: Stats;
    colors?: {
        overall?: string;
        volume?: string;
        chapter?: string;
    }
}>();

const emits = defineEmits<{
    (e: 'click'): void;
}>();

const colours = computed(() => {
    return {
        overall: props.colors?.overall ?? 'var(--color-primary)',
        volume: props.colors?.volume ?? 'var(--color-secondary)',
        chapter: props.colors?.chapter ?? 'var(--color-success)',
    }
});

const getStats = () => {
    let progress: Progress | undefined;
    let stats: Stats | undefined;

    const checks = [
        () => {
            if (!props.manga) return;

            progress = props.manga.progress;
            stats = props.manga.stats;
        },
        () => {
            if (props.progress) progress = props.progress;
            if (props.stats) stats = props.stats;
        },
        () => {
            if (!data.value?.volumed) return;

            progress = data.value.volumed.progress;
            stats = data.value.volumed.stats;
        }
    ];

    for(const check of checks) {
        check();
        if (progress && stats) break;
    }

    return { progress, stats };
}

const computePercentages = () => {
    const { progress, stats } = getStats();

    if (!progress || !stats) return { overall: 0, volume: 0, chapter: 0 };


}
</script>

<style lang="scss" scoped>

</style>
