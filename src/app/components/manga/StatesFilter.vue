<template>
    <select v-model="state" v-if="canRead">
        <option
            v-for="state in STATE_ROLLUP"
            :key="state.index"
            :value="state.index"
        >
            {{ state.text }}
        </option>
    </select>
</template>

<script setup lang="ts">
import { STATE_ROLLUP } from '~/models';
import type { MangaSearchFilter } from '~/models';

const { canRead } = useAuthHelper();

const props = defineProps<{
    modelValue: MangaSearchFilter;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: MangaSearchFilter): void;
}>();

const filter = computed({
    get: () => props.modelValue,
    set: (value: MangaSearchFilter) => emits('update:modelValue', value)
});

const state = computed({
    get: () => {
        for(const s of STATE_ROLLUP) {
            if (s.get(filter.value)) return s.index;
        }

        return STATE_ROLLUP[STATE_ROLLUP.length - 1]!.index;
    }, set: (value: number) => {
        STATE_ROLLUP.find(s => s.index === value)?.set(filter.value);
        tap();
    }
})

const tap = () => {
    filter.value = { ...filter.value };
}


</script>
