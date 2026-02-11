<template>
<div class="button-tags">
    <button
        v-for="(btn, index) in properOptions"
        :key="index"
        :class="{ include: btn.value === value, caps: capitalize }"
        @click="() => value = btn.value"
        :title="btn.description"
    >{{ btn.name }}</button>
</div>
</template>
<script setup lang="ts" generic="T = string">
type Options = T | undefined;

interface Props {
    options: (T | { name: string, value: T, description?: string })[];
    modelValue: Options;
    capitalize?: boolean;
}

interface Emits {
    (e: 'update:modelValue', v: Options): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const properOptions = props.options.map(opt => !(opt && typeof opt === 'object' && 'name' in opt) ? { name: opt, value: opt, description: '' } : opt);

const value = computed({
    get: () => props.modelValue,
    set: (value: Options) => emits('update:modelValue', value)
});
</script>
