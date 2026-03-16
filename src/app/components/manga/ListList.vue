<template>
    <SearchList
        :items="lists"
        :pending="pending"
        capitalize
        :title="title"
        :allow-reload="showReload"
        :pagination="pagination"
        :hide-back="hideBack"
        :show-grid="listStyle === ListStyle.Album"
        @onscrolled="emits('onscrolled')"
        @reload="emits('reload')"
        @headerstuck="(t) => headerStuck = t"
        @load-page="(t) => emits('load-page', t)"
        @back="() => emits('back')"
        :styles="listStyle"
    >
        <template #default="{ item }">
            <ListCard :list="item" />
        </template>

        <template #extra-buttons>
            <div class="btn-group">
                <IconBtn
                    v-for="sty in styles"
                    @click="() => style = sty.style"
                    :icon="sty.icon"
                    :color="sty.style === listStyle ? 'primary' : 'shade'"
                />
                <slot name="extra-buttons" />
            </div>
        </template>

        <template #header>
            <slot />
        </template>

    </SearchList>
</template>

<script lang="ts" setup>
import { ListStyle } from '~/models';
import type { booleanish, MbTypeList, MbTypeListSearch } from '~/models';

const { listStyle } = useAppSettings();

const emits = defineEmits<{
    (e: 'onscrolled'): void;
    (e: 'reload'): void;
    (e: 'load-page', value: number): void;
    (e: 'update:modelValue', value: boolean): void;
    (e: 'back'): void;
}>();

const props = defineProps<{
    lists: (MbTypeList | MbTypeListSearch)[];
    pending?: booleanish;
    title: string;
    pagination?: {
        page: number;
        pages: number;
        size: number;
        total: number;
    };
    modelValue?: boolean;
}>();

const style = computed<ListStyle>({
    get: () => listStyle.value,
    set: (value: ListStyle) => listStyle.value = value
});

const headerStuck = computed({
    get: () => props.modelValue ?? false,
    set: (value: boolean) => emits('update:modelValue', value)
});

const showReload = computed(() => !!getCurrentInstance()?.vnode.props?.onReload);
const hideBack = computed(() => !getCurrentInstance()?.vnode.props?.onBack);

const styles = [
    { icon: 'list', style: ListStyle.Compact },
    { icon: 'expand', style: ListStyle.Expanded },
    { icon: 'book', style: ListStyle.Album }
];
</script>

<style lang="scss" scoped>
.btn-group {
    margin-top: 0;
    border: 0;
    background-color: transparent;

    button {

        &:not(:first-child):not(:last-child) {
            border-radius: 0;
        }

        &:first-child {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }

        &:last-child {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    }
}
</style>

