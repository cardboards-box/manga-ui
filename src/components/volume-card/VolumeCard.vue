<template>
<div class="volume-card" :class="{ 'version': version, 'no-buttons': !hasButtons }">
    <NuxtLink :to="url" :class="{ 'active': isRead }" class="cell">
        <Icon v-if="isRead">done_all</Icon>
        <Icon v-if="chapter.id === progress?.mangaChapterId">
            auto_stories
        </Icon>
        {{ chapter.volume ? 'Vol. ' + chapter.volume + ' ' : '' }}
        Ch. {{ chapter.ordinal }}
        {{ chapter.title ? ' - ' + chapter.title : '' }}
    </NuxtLink>
    <span class="cell">
        <Icon>schedule</Icon>&nbsp;
        <Date :date="chapter.createdAt.toString()" format="partial" />
    </span>
    <div class="cell btns" v-if="hasButtons">
        <IconBtn 
            other-classes="cell"
            v-if="currentUser"
            :loading="loading"
            :icon="isRead ? 'visibility_off' : 'visibility'"
            @click="toggleRead"
        />
        <IconBtn 
            v-if="hasVersions"
            other-classes="cell"
            :loading="loading"
            :icon="isOpen ? 'expand_less' : 'expand_more'"
            @click="() => $emit('toggle-open')"
        />
    </div>
</div>
</template>
    
<script setup lang="ts">
import { Chapter, Progress } from '~/models';

const { toPromise } = useApiHelper();
const { markAsRead } = useMangaApi();

const { currentUser } = useAuthApi();

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
}>();

const loading = ref(false);
const isRead = computed(() => props.modelValue);
const isOpen = computed(() => props.open ?? false);
const url = computed(() => {
    let base = `/manga/${props.chapter.mangaId}/${props.chapter.id}`;
    if (props.chapter.id === props.progress?.mangaChapterId)
        base += `?page=${(props.progress.pageIndex ?? 0) + 1}`;
    return base;
});
const hasButtons = computed(() => !props.version && (!!currentUser.value || props.hasVersions));

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