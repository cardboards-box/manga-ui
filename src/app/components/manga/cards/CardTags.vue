<template>
    <div class="card-tags" :class="style">
        <div class="header">{{ title }}: </div>
        <slot />
    </div>
</template>

<script lang="ts" setup>
import type { ListStyle } from '~/models';

withDefaults(defineProps<{
    style: ListStyle;
    title?: string;
}>(), {
    title: 'Tags'
});
</script>

<style lang="scss" scoped>
.card-tags {
    .header {
        display: inline-block;
        font-weight: bold;
    }

    &.album, &.compact {
        display: none;
    }
}
</style>
