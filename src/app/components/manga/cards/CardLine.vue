<template>
    <div class="card-line" :class="style">
        <span>
            <b>{{ title }}:</b>&nbsp;
            <slot />
        </span>
    </div>
</template>

<script lang="ts" setup>
import type { ListStyle } from '~/models';

defineProps<{
    title: string;
    style: ListStyle
}>();
</script>

<style lang="scss" scoped>
.card-line {
    &.album, &.compact {
        display: none;
    }
}
</style>
