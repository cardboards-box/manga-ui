<template>
    <div class="volume-card" :class="{ 'version': version && !hasSlot, 'no-buttons': !hasButtons }">
    <NuxtLink :to="url" :class="{ 'active': isRead }" class="cell" :target="external ? '_black': ''" :title="external ? 'External Manga' : 'Read ' + title">
        <Icon v-if="external">ungroup</Icon>
        <Icon v-if="isRead">done_all</Icon>
        <Icon v-if="chapter.id === progress?.chapterId">
            auto_stories
        </Icon>
        {{ title }}
    </NuxtLink>
    <span class="cell">
        <Icon>schedule</Icon>&nbsp;
        <Date :date="chapter.createdAt.toString()" utc format="r" />
    </span>
    <div class="cell btns" v-if="hasButtons">
        <IconBtn
            class="margin-right"
            v-if="canRead && !version"
            inline
            :loading="loading"
            :icon="isRead ? 'visibility_off' : 'visibility'"
            @click="toggleRead"
        />
        <IconBtn
            v-if="hasVersions"
            class="margin-right"
            :loading="loading"
            inline
            :icon="isOpen ? 'expand_less' : 'expand_more'"
            @click="() => isOpen = !isOpen"
        />
        <slot />
    </div>
</div>
</template>

<script setup lang="ts">
import type { booleanish, MbChapter, MbChapterProgress } from '~/models';

const { chapterTitle } = useMangaUtils();
const { isTrue } = useUtils();
const { canRead } = useAuthHelper();
const api = useMangaApi();

const props = defineProps<{
    chapter: MbChapter;
    progress?: MbChapterProgress;
    version?: boolean;
    open?: boolean;
    hasVersions?: boolean;
    modelValue?: boolean;
    hasSlot?: booleanish;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const loading = ref(false);
const isRead = computed(() => !!props.progress?.lastRead);
const isOpen = computed({
    get: () => props.modelValue ?? false,
    set: (value: boolean) => emits('update:modelValue', value)
})
const external = computed(() => props.chapter.externalUrl);
const url = computed(() => {
    if (external.value) return external.value;

    let base = `/chapter/${props.chapter.id}`;
    if (props.chapter.id === props.progress?.chapterId)
        base += `?page=${(props.progress.pageOrdinal ?? 1)}`;
    return base;
});
const hasSlot = computed(() => isTrue(props.hasSlot));
const hasButtons = computed(() => hasSlot.value || (!props.version && (canRead.value || props.hasVersions)));
const title = computed(() => chapterTitle(props.chapter));

const toggleRead = async () => {
    if (!canRead.value) return;

    loading.value = true;
    const res = await api.promise.progress.update(props.chapter.id,
        isRead.value ? undefined : (props.progress?.pageOrdinal ?? props.chapter.pageCount ?? 1));
    loading.value = false;
    if (api.isSuccess(res)) emits('update:modelValue', !isRead.value);
}

</script>

<style scoped lang="scss">
.volume-card {
    display: grid;
    gap: 5px;
    grid-template-columns: auto 150px 100px;
    grid-template-rows: auto;
    align-items: center;
    background-color: var(--bg-color-accent);
    padding-left: 10px;
    padding-bottom: 5px;

    .cell {
        margin: auto 0px;
        display: flex;
        flex-flow: row;
        align-items: center;

        &.btns {
            justify-content: flex-end;

            .btn:last-child {
                margin-right: var(--margin);
            }
        }
    }

    a.cell {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    &.version {
        grid-template-columns: auto 150px;
    }

    &:not(.version):last-child {
        padding-bottom: 0;
    }

    &.no-buttons {
        grid-template-columns: auto 150px;
        min-height: 46px;
    }
}
</style>
