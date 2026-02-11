<template>
<div class="button-tags">
    <button
        v-for="(btn, index) in options"
        :class="{ include: index === value, caps: capitalize }"
        @click="() => value = index"
    >{{ btn }}</button>
</div>
</template>
<script setup lang="ts">
type Options = number | undefined;

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
</script>