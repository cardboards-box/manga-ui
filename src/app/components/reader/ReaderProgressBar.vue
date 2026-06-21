<template>
    <div
        class="progress-bar"
        :class="style"
        v-if="style !== ProgressBarStyle.None"
    >
        <NuxtLink
            v-for="page of pages"
            :key="page.image.id"
            :to="pageLink(page.image)"
            :class="determineStateClass(page)"
            class="progress"
        />
        <div
            class="progress-percent"
            v-if="percentage !== undefined"
        />
    </div>
</template>

<script setup lang="ts">
import { ProgressBarStyle, type MbImage } from '~/models';

type ClassMap = `${('error' | 'loading' | 'initial' | 'loaded')} ${('read' | 'current' | 'unread')}`;

const props = defineProps<{
    pages: PageImage[];
    currentIds: string[];
    percentage?: number;
    style: ProgressBarStyle;
}>();

const { chapter } = useReaderHelper();

/** Converts chapter progress into the CSS value used by the progress indicator. */
const fullPercent = computed(() => `${props.percentage ?? 0}%`);

/** Builds a page link for the progress bar segment. */
const pageLink = (page: MbImage) => `/chapter/${chapter.value?.id}?page=${page.ordinal}`;

/** Determines loading/read/current styling for a progress bar segment. */
const determineStateClass = (page: PageImage): ClassMap => {
    const currentIndexes = props.currentIds
        .map(id => props.pages.findIndex(i => i.image.id === id))
        .filter(i => i >= 0);
    const firstCurrentIndex = currentIndexes.length > 0
        ? Math.min(...currentIndexes)
        : props.pages.findIndex(i => i.image.id === page.image.id);
    const index = props.pages.findIndex(i => i.image.id === page.image.id);
    const isCurrent = props.currentIds.includes(page.image.id);
    const readState = index < firstCurrentIndex ? 'read' : isCurrent ? 'current' : 'unread';

    return `${page.state} ${readState}`;
}
</script>

<style lang="scss" scoped>
$progress-height: 10px;
$progress-margin: 1px;

$loading-primary: var(--color-primary);
$loading-secondary: transparent;
$loading-speed: 0.5s;
$current-border-fade-speed: 1.25s;
$progress-percent: v-bind(fullPercent);
$progress-percent-dot-size: 8px;

.progress-bar {
    position: fixed;
    display: flex;
    flex-flow: row;
    z-index: 1;

    .progress {
        flex: 1;
        box-sizing: border-box;
        background-color: var(--color-primary);
        transition: all 250ms;
        cursor: pointer;

        &.loading {
            background: repeating-linear-gradient(90deg, #{$loading-primary} 0 calc(25% - 5px), #{$loading-secondary} 0 25%) left/calc(4*100%/3) 100%;
            animation: loading-animation #{$loading-speed} infinite linear;
        }

        &.initial { background: color-mix(in srgb, var(--color-primary) 20%, transparent); }
        &.error { background-color: var(--color-warning); }
        &.loaded { background-color: var(--color-primary); }

        &.read { border: 1px solid var(--color-primary); }
        &.current {
            border: 3px solid var(--color);
            animation: current-border-fade #{$current-border-fade-speed} infinite ease-in-out;
        }
        &.unread { border: 1px dashed var(--color); }
    }

    .progress-percent {
        position: absolute;

        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: $progress-percent-dot-size;
            height: $progress-percent-dot-size;
            border-radius: 50%;
            background-color: var(--color-warning);
            border: 1px solid var(--color);
            transform: translate(-50%, -50%);
        }
    }

    &.bottom, &.top {
        width: 100%;
        height: $progress-height;
        left: 0;

        .progress {
            height: 100%;
            margin: 0 $progress-margin;
        }

        .progress-percent {
            left: $progress-percent;
            bottom: 0;
            width: 2px;
            height: 100%;
        }

        &:hover { height: #{$progress-height * 2}; }
    }

    &.left, &.right {
        top: 0;
        height: 100%;
        flex-flow: column;
        width: $progress-height;

        .progress {
            width: 100%;
            height: 100%;
            margin: $progress-margin 0;

            &.loading {
                background: repeating-linear-gradient(180deg, #{$loading-primary} 0 calc(25% - 5px), #{$loading-secondary} 0 25%) top/100% calc(4*100%/3);
                animation: loading-animation-vertical #{$loading-speed} infinite linear;
            }
        }

        .progress-percent {
            top: $progress-percent;
            left: 0;
            width: 100%;
            height: 2px;
        }

        &:hover { width: #{$progress-height * 2}; }
    }

    &.top { top: 0; }
    &.bottom { bottom: 0; }
    &.left { left: 0; }
    &.right { right: 0; }
}

@keyframes loading-animation {
    100% { background-position: right; }
}

@keyframes loading-animation-vertical {
    100% { background-position: bottom; }
}

@keyframes current-border-fade {
    0% { border-color: var(--color); }
    50% { border-color: var(--color-primary); }
    100% { border-color: var(--color); }
}
</style>
