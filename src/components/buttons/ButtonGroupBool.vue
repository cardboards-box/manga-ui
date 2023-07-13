<template>
<div class="button-tags">
    <button
        :class="{include: value }"
        @click="() => value = true"
    >
        <Icon unsize="true" size="16px">{{ onIcon ?? 'arrow_drop_up' }}</Icon>
        <p>{{ on ?? 'Ascending' }}</p>
    </button>
    <button
        :class="{include: !value}"
        @click="() => value = false"
    >
        <Icon unsize="true" size="16px">{{ offIcon ?? 'arrow_drop_down' }}</Icon>
        <p>{{ off ?? 'Descending' }}</p>
    </button>
</div>
</template>
<script setup lang="ts">

type Options = boolean;

interface Props {
    on?: string;
    off?: string;
    onIcon?: string;
    offIcon?: string;
    modelValue: Options;
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