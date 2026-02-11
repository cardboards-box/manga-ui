<template>
    <InputGroup
        v-model="value"
        :link="wrapedUrl"
        placeholder="Image URL"
        :disabled="!wrapedUrl"
        :stuck="stuck"
    >
        <template #input>
            <input
                type="file"
                class="file-input"
                accept="image/*"
                @change="selected"
                ref="fileinput"
            />
            <IconBtn
                icon="upload"
                inline
                @click="() => fileinput?.click()"
            />
        </template>
    </InputGroup>
</template>

<script setup lang="ts">
import type { booleanishext } from '~/models';

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'file', value: File): void;
}

interface Props {
    modelValue: string;
    stuck?: booleanishext
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();
const fileinput = ref<HTMLElement>();

const value = computed({
    get: () => props.modelValue,
    set: (value: string) => emits('update:modelValue', value)
});

const wrapedUrl = computed(() =>
    value.value
        ? `/?url=${encodeURIComponent(value.value)}`
        : undefined
    );

const selected = (event: Event) => {
    if (!event?.target) return;

    const files: File[] = (<any>event.target).files;
    if (!files || files.length <= 0) return;

    const file = files[0]!;
    emits('file', file);
}

</script>

<style lang="scss" scoped>
.control {
    .file-input { display: none; }
    a, button { padding: 10px; }
}
</style>
