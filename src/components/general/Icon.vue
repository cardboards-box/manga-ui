<template>
<ClientOnly>
    <span 
        class="material-symbols-outlined"
        :class="{ 'unsize': unsize, 'fill-icon': fill, 'spin': spin, 'flip': flip }" 
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
defineProps<{
    unsize?: boolean | string,
    fill?: boolean | string,
    spin?: boolean | string,
    size?: string,
    rotate?: number | string,
    speed?: string,
    flip?: boolean | string
}>();
</script>

<style lang="scss">
    .material-symbols-outlined {
        margin: auto 0;
        display: inline-block;
        fill: currentColor;
        height: 24px;
        width: 24px;
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;

        &.fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48; }
        &.unsize { height: unset; width: unset; }
        &.spin { animation: spin 10s linear infinite; }
        &.flip { transform: scaleX(-1); }
        &.span.flip { animation-name: spinflip; }
    }
</style>