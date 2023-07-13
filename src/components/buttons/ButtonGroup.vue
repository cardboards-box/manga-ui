<template>
<div class="button-tags">
    <button
        v-for="btn in options"
        :class="classes(btn)"
        @click="() => toggle(btn)"
    >{{ btn }}</button>
</div>
</template>
<script setup lang="ts">
type Options = string[];

interface Props {
    options: string[];
    modelValue: Options;
    capitalize?: boolean;
}

interface Emits {
    (e: 'update:modelValue', v: Options): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const value = computed({
    get: () => props.modelValue,
    set: (value: Options) => emits('update:modelValue', value)
});

const state = (opt: string) => {
    if (value.value.indexOf(opt) !== -1) return 'include';
    return 'none';
}

const classes = (tag: string) => {
    return [
        state(tag),
        props.capitalize ? 'caps' : ''
    ].join(' ');
}

const toggle = (tag: string) => {
    const ii = value.value.indexOf(tag);

    if (ii === -1) value.value = [...value.value, tag];
    else value.value.splice(ii, 1);
};
</script>