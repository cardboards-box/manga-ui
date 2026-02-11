<template>
<div class="button-tags">
    <button
        v-for="opt in properOptions"
        :class="state(opt.id)"
        @click="toggle(opt.id)"
    >
        <Icon unsize="true" size="16px">{{ icon(opt.id) }}</Icon>
        <p>{{ opt.name }}</p>
    </button>
</div>
</template>

<script setup lang="ts">
interface Props {
    options: (string | { name: string; id: string })[];
    on: string[];
    off: string[];
}

interface Emits {
    (e: 'update:on', v: string[]): void;
    (e: 'update:off', v: string[]): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const properOptions = computed(() => props.options.map(opt => typeof opt === 'string' ? { name: opt, id: opt } : opt));

const on = computed({
    get: () => props.on,
    set: (value: string[]) => emits('update:on', value)
});
const off = computed({
    get: () => props.off,
    set: (value: string[]) => emits('update:off', value)
});

const state = (opt: string) => {
    if (on.value.indexOf(opt) !== -1) return 'include';
    if (off.value.indexOf(opt) !== -1) return 'exclude';
    return 'none';
};

const toggle = (tag: string) => {
    const ii = on.value.indexOf(tag);
    const ei = off.value.indexOf(tag);

    switch(state(tag)) {
        case 'include':
            if (ii !== -1) on.value.splice(ii, 1);
            if (ei === -1) off.value = [...off.value, tag];
            break;
        case 'exclude':
            if (ii !== -1) on.value.splice(ii, 1);
            if (ei !== -1) off.value.splice(ei, 1);
            break;
        case 'none':
            if (ii === -1) on.value = [...on.value, tag];
            if (ei !== -1) off.value.splice(ei, 1);
            break;
    }
};

const icon = (tag: string) => {
    switch(state(tag)) {
        case 'include': return 'add';
        case 'exclude': return 'remove';
    }

    return '';
}

</script>
