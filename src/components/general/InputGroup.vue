<template>
<div class="input-group" :class="{ open, stuck: isStuck }">
    <div class="input-header control fill no-top group center-items">
        <input
            class="fill"
            type="text"
            :placeholder="placeholder"
            v-model="search"
            @keyup.enter="doSearch()"
        />
        <IconBtn 
            icon="close"
            inline
            icon-size="16px"
            @click="() => search = ''"
        />
        <IconBtn
            icon="content_paste"
            inline
            icon-size="16px"
            @click="fromClipboard"
        />
        <div class="sep" />
        <slot name="input" />

        <IconBtn
            v-if="isDrawer"
            :icon="openIcon"
            inline
            @click="() => open = !open"
        />
        <IconBtn
            :icon="icon"
            inline
            :link="link"
            @click="doSearch(true)"
            :disabled="isDisabled"
        />
    </div>
    <div class="input-drawer">
        <div class="drawer-content">
            <slot />
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { booleanishext, isTrue } from '~/models';
const slots = useSlots();

const props = withDefaults(defineProps<{
    placeholder?: string,
    modelValue?: string,
    link?: string,
    icon?: string,
    openIcon?: string,
    stuck?: booleanishext,
    disabled?: booleanishext
}>(), {
    icon: 'search',
    openIcon: 'tune'
});

const isDrawer = computed(() => !!slots['default']);
const isStuck = computed(() => isTrue(props.stuck));
const isDisabled = computed(() => isTrue(props.disabled));

const emits = defineEmits<{
    (e: 'update:modelValue', v: string | undefined): void;
    (e: 'search'): void;
    (e: 'open', v: boolean): void;
}>();
const _open = ref(false);

const open = computed({
    get: () => isDrawer.value && _open.value,
    set: (value: boolean) => {
        _open.value = value
        emits('open', value);
    }
});

const search = computed({
    get: () => props.modelValue,
    set: (value: string | undefined) => emits('update:modelValue', value)
});

const fromClipboard = async () => {
    const data = await navigator.clipboard.readText();
    if (data) search.value = data;
}

const doSearch = (trigger?: boolean) => {
    if (props.link && !trigger) navigateTo(props.link);
    emits('search');
}
</script>

<style lang="scss">
.input-group {
    background-color: var(--bg-color-accent);
    border: 1px solid var(--bg-color-accent);
    border-radius: calc(var(--brd-radius) * 2);
    overflow: hidden;

    .input-header {
        background-color: transparent !important;
        border-color: transparent !important;
        margin-top: 0;

        button, a { margin: auto 5px !important; }

        .select-styled {
            background-color: transparent;
            border-color: transparent;
            min-width: 100px;
        }
    }

    .input-drawer {
        overflow: hidden;
        max-height: 0;
        transition: all 250ms;
        padding: 0;
        border: 1px solid transparent;
        position: relative;

        .drawer-content {
            overflow-x: hidden;
            overflow-y: auto;
            max-height: calc(80vh - 20px);
            padding: 10px;
        }
    }

    &:focus-within { border-color: var(--color-primary); }
    &.stuck { background-color: var(--bg-color-accent-dark); }

    &.open .input-drawer {
        max-height: 80vh;
        border-top-color: var(--bg-color-accent);
    }
}
</style>