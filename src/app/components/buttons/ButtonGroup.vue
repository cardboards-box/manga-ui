<template>
<div class="button-tags">
    <button
        v-for="btn in properOptions"
        :class="classes(btn.value)"
        @click="() => toggle(btn.value)"
    >{{ btn.name }}</button>
</div>
</template>
<script setup lang="ts" generic="T = string">
type Options = T[] | undefined;

interface Props {
    options: (T | { name: string, value: T })[];
    modelValue: Options;
    capitalize?: boolean;
}

interface Emits {
    (e: 'update:modelValue', v: Options): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const properOptions = props.options.map(opt => !(opt && typeof opt === 'object' && 'name' in opt) ? { name: opt, value: opt } : opt);

const value = computed({
    get: () => props.modelValue ?? [],
    set: (value: Options) => emits('update:modelValue', value)
});

const state = (opt: T) => {
    if (value.value.indexOf(opt) !== -1) return 'include';
    return 'none';
}

const classes = (tag: T) => {
    return [
        state(tag),
        props.capitalize ? 'caps' : ''
    ].join(' ');
}

const toggle = (tag: T) => {
    const ii = value.value.indexOf(tag);

    if (ii === -1) value.value = [...value.value, tag];
    else value.value.splice(ii, 1);
};
</script>
