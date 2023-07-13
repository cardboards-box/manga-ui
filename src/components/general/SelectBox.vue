<template>
<div class="select-styled" :class="{ 'transparent': transparent, 'fill': fill }">
    <select v-model="value" :disabled="disabled" :aria-disabled="disabled">
        <slot />
    </select>
</div>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: unknown;
    disabled?: boolean;
    transparent?: boolean;
    fill?: boolean
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', v: unknown): void;
}>();

const value = computed({
    get: () => props.modelValue,
    set: (val: any) => emits('update:modelValue', val)
});

</script>

<style lang="scss">
$ctrl-bg: var(--bg-color-accent);
.select-styled {
    position: relative;
    background-color: $ctrl-bg;
    color: var(--color);
    padding: 10px;
    border-radius: var(--brd-radius);
    outline: none;
    border: 1px solid #{$ctrl-bg};
    font-family: var(--font-family);
    transition: all 250ms;

    select {
        background-color: transparent;
        -moz-appearance:none; /* Firefox */
        -webkit-appearance:none; /* Safari and Chrome */
        appearance: none;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
        border: none;

        option {
            padding: 5px;
        }
    }

    &:after {
        content: '\0025BC';
        color: white;
        font-size: 10px;
        pointer-events: none;
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
    }

    &.transparent {
        background-color: transparent;
        border: 1px solid transparent;
    }
}
</style>