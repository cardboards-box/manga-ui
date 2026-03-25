<template>
    <SearchList
        :items="manga"
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
            <MangaCard
                v-if="'entity' in item"
                :manga="item"
                :content-ratings="contentRatings"
            >
                <template #title>
                    <slot name="card-title" :manga="item" />
                </template>
                <template #default>
                    <slot name="card-body" :manga="item" />
                </template>
            </MangaCard>
            <RISCard
                v-else
                :manga="item"
                :content-ratings="contentRatings"
            />
        </template>

        <template #extra-buttons>
            <slot name="extra-buttons" />
            <div class="btn-group">
                <IconBtn
                    v-for="sty in styles"
                    @click="() => style = sty.style"
                    :icon="sty.icon"
                    :color="sty.style === listStyle ? 'primary' : 'shade'"
                />
            </div>
        </template>

        <template #header>
            <slot />
        </template>
    </SearchList>
</template>

<script lang="ts" setup>
import { ListStyle } from '~/models';
import type {
    booleanish, EnumDescription,
    ImageSearchResultType,
    MbTypeManga, MbTypeMangaSearch,
    ContentRating
} from '~/models';

const { listStyle } = useAppSettings();
const { canRead } = useAuthHelper();
const progress = useProgressCacheHelper();

const emits = defineEmits<{
    (e: 'onscrolled'): void;
    (e: 'reload'): void;
    (e: 'load-page', value: number): void;
    (e: 'update:modelValue', value: boolean): void;
    (e: 'back'): void;
}>();

const props = defineProps<{
    manga: (MbTypeManga | MbTypeMangaSearch | ImageSearchResultType)[],
    pending?: booleanish;
    title: string;
    pagination?: {
        page: number;
        pages: number;
        size: number;
        total: number;
    },
    contentRatings: EnumDescription<ContentRating>[];
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

const loadProgress = async (key?: string) => {
    if (!canRead.value || !import.meta.client) return;

    const mids = [... new Set(props.manga.map(t => {
        if ('entity' in t) return t.entity.id;
        return t.closest?.entity.id!;
    }).filter(t => !!t))];

    if (!mids.length) return;

    progress.load(mids);
}

watch(() => props.manga, () => {
    loadProgress('props.manga');
}, { deep: true });

watch(canRead, () => loadProgress('canRead'));

onMounted(() => {
    loadProgress('onMounted');
});

onUnmounted(() => {
    progress.clear();
});

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
