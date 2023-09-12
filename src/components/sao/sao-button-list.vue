<template>
    <div class="sao-floating-buttons" :class="{ 'active': isTrue(active) }">
        <div class="fade"></div>
        <div class="buttons flex row">
            <sao-button active />
            <sao-button />
            <sao-button />
            <sao-button />
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { booleanish, isTrue } from '~/models';

defineProps<{
    active?: booleanish;
}>();
</script>

<style scoped lang="scss">
.sao-floating-buttons {
    position: fixed;
    display: flex;
    top: -100%;
    left: 0;
    width: min(100vw, 100%);
    height: min(100vh, 100%);
    z-index: 1000;
    justify-content: center;
    overflow: hidden;
    transition: all 250ms;

    &.active {
        top: 0;

        .fade {
            opacity: 1;
        }
    }

    .fade {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color-accent-darkish);
        opacity: 0;
        z-index: 1001;
        transition: all 250ms;
    }

    .buttons {
        z-index: 1001;
        max-height: 100%;
        overflow-y: auto;
        margin: auto 20px;
    }
}
</style>
