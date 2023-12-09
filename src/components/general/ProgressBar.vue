<template>
    <NuxtLink
        class="progress-item flex row"
        :class="classes"
        :to="link"
        :target="isExternal(link) ? '_blank' : undefined"
    >
        <header class="flex">
            <Icon v-if="icon" class="margin-right">{{ icon }}</Icon>
            <span class="fill center-vert">{{ label }}</span>
            <span class="mute center-vert" v-if="!sideLabel">{{ percent.toFixed(2) }}%</span>
            <span class="mute center-vert" v-else>{{ sideLabel }}</span>
        </header>
        <main>
            <div class="progress" :style="{ width: percent + '%'}"></div>
        </main>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { ClassOptions, booleanish } from '~/models';

const { serClasses, isExternal, isTrue } = useUtils();

const props = defineProps<{
    percent: number;
    label: string;
    sideLabel?: string;
    icon?: string;
    link?: string;
    noTopMargin?: booleanish;
    'class'?: ClassOptions;
}>();

const classes = computed(() => serClasses(props.class, {
    'margin-top': !isTrue(props.noTopMargin),
    'no-hover': !props.link
}));
</script>

<style scoped lang="scss">
$progress-height: 6px;
$progress-radius: calc($progress-height / 2);
.progress-item {
    header {
        overflow: hidden;

        .fill {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    main {
        height: $progress-height;
        border-radius: $progress-radius;
        overflow: hidden;
        margin-top: $progress-radius;
        border: 1px solid var(--bg-color-accent-dark);
        position: relative;

        .progress {
            top: 0;
            left: 0;
            height: $progress-height;
            background-color: var(--color-primary);
        }
    }

    &.no-hover { cursor: default; }
}

</style>
