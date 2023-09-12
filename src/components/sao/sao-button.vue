<template>
    <button class="sao-icon" :class="{ 'active': isTrue(active) }">
        <div class="ring">
            <Icon size="24px">{{ icon }}</Icon>
        </div>
    </button>
</template>

<script setup lang="ts">
import { booleanish, isTrue } from '~/models';

withDefaults(defineProps<{
    icon?: string;
    active?: booleanish;
}>(), {
    icon: 'home'
});
</script>

<style scoped lang="scss">
$button-size: 60px;
$background-color: rgba(155, 155, 155, 0.45);
$primary-color: #EBA601;
.sao-icon {
    position: relative;
    border-radius: 50%;
    margin: var(--margin);
    border: 2px solid #{$background-color};
    width: $button-size;
    height: $button-size;
    transition: all 250ms;

    .ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: $background-color;
        width: calc(#{$button-size} - 10px);
        height: calc(#{$button-size} - 10px);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        transition: all 250ms;
    }

    &.active,
    &:hover {
        border-color: $primary-color;
        .ring {
            background-color: $primary-color;
        }
    }

}
</style>
