<template>
<div class="volume-card" :class="{ 'version': version && !hasSlot, 'no-buttons': !hasButtons }">
    <NuxtLink :to="url" :class="{ 'active': isRead }" class="cell" :target="external ? '_black': ''" :title="external ? 'External Manga' : 'Read ' + title">
        <Icon v-if="external">ungroup</Icon>
        <Icon v-if="isRead">done_all</Icon>
        <Icon v-if="chapter.id === progress?.mangaChapterId">
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
            v-if="currentUser && !version"
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
            @click="() => $emit('toggle-open')"
        />
        <slot />
    </div>
</div>
</template>

<script setup lang="ts">
import type { Chapter, Progress, booleanish } from '~/models';

const { toPromise } = useApiHelper();
const { markAsRead } = useMangaApi();

const { currentUser } = useAuthApi();
const { isTrue } = useUtils();

const emits = defineEmits<{
    (e: 'toggle-open'): void;
    (e: 'update:modelValue', value: boolean): void;
}>();

const props = defineProps<{
    chapter: Chapter,
    progress?: Progress,
    version?: boolean,
    open?: boolean,
    hasVersions?: boolean
    modelValue: boolean;
    hasSlot?: booleanish;
}>();

const loading = ref(false);
const isRead = computed(() => props.modelValue);
const isOpen = computed(() => props.open ?? false);
const external = computed(() => props.chapter.externalUrl);
const url = computed(() => {
    if (external.value) return external.value;

    let base = `/manga/${props.chapter.mangaId}/${props.chapter.id}`;
    if (props.chapter.id === props.progress?.mangaChapterId)
        base += `?page=${(props.progress.pageIndex ?? 0) + 1}`;
    return base;
});
const hasSlot = computed(() => isTrue(props.hasSlot));
const hasButtons = computed(() => hasSlot.value || (!props.version && (!!currentUser.value || props.hasVersions)));
const title = computed(() => {
    let output = '';
    if (props.chapter.volume)
        output += `Vol. ${props.chapter.volume} `;
    output += `Ch. ${props.chapter.ordinal}`;
    if (props.chapter.title)
        output += ` - ${props.chapter.title}`;
    return output;
});

const toggleRead = async () => {
    if (!currentUser.value) return;

    loading.value = true;
    const result = await toPromise(markAsRead(props.chapter.mangaId, props.chapter.id));
    loading.value = false;
    if (result?.worked)
        emits('update:modelValue', !props.modelValue);
}
</script>

<style lang="scss" scoped>
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
