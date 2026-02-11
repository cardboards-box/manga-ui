<template>
    <ClientOnly>
        <span
            class="material-symbols-outlined"
            :class="classes"
            :title="title"
            :style="{
                'font-size': size,
                transform: `rotate(${rotate || 0}deg) scaleX(${flip ? -1 : 1})`,
                'animation-duration': speed
            }"
        >
            <slot />
        </span>
    </ClientOnly>
</template>

<script setup lang="ts">
import type { ClassOptions, booleanish } from '~/models';
const { isTrue, serClasses } = useUtils();

const props = defineProps<{
    unsize?: booleanish,
    fill?: booleanish,
    spin?: booleanish,
    size?: string,
    rotate?: number | string,
    speed?: string,
    flip?: booleanish,
    'class'?: ClassOptions,
    title?: string
}>();

const classes = computed(() => serClasses(props.class, {
    'unsize': isTrue(props.unsize),
    'fill-icon': isTrue(props.fill),
    'spin': isTrue(props.spin),
    'flip': isTrue(props.flip)
}));
</script>

<style lang="scss">
.material-symbols-outlined {
    margin: auto 0;
    display: inline-block;
    fill: currentColor;
    height: 24px;
    width: 24px;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;

    &.fill-icon {
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
    }

    &.unsize {
        height: unset;
        width: unset;
    }

    &.spin {
        animation: spin 10s linear infinite;
    }

    &.flip {
        transform: scaleX(-1);
    }

    &.spin.flip {
        animation-name: spinflip;
    }

    &.margin-left { margin-left: var(--margin) !important; }
    &.margin-right { margin-right: var(--margin) !important; }
}
</style>
