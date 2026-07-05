<template>
    <div class="chapter-list">
        <template v-for="(chapter, index) in displayedChapters" :key="`${chapter.ordinal}:${index}`">
            <div
                v-if="primaryChapter(chapter)"
                class="chapter-row"
                :class="status(chapter)"
            >
                <NuxtLink
                    class="chapter-link"
                    :class="{ 'without-status': !canRead }"
                    :to="chapterUrl(primaryChapter(chapter)!)"
                    :target="chapterTarget(primaryChapter(chapter)!)"
                >
                    <span v-if="canRead" class="status-dot">
                        <Icon v-if="status(chapter) === 'read'" size="14px" unsize>check</Icon>
                        <Icon v-else-if="status(chapter) === 'current'" size="14px" unsize>play_arrow</Icon>
                    </span>
                    <span class="chapter-number">Ch.{{ chapter.ordinal }}</span>
                    <strong>{{ primaryChapter(chapter)!.chapter.title || chapterTitle(primaryChapter(chapter)!.chapter) }}</strong>
                </NuxtLink>

                <div class="chapter-meta">
                    <em v-if="canRead && status(chapter) === 'current'">Now Reading</em>
                    <small v-if="primaryChapter(chapter)!.chapter.pageCount">{{ primaryChapter(chapter)!.chapter.pageCount }}p</small>
                    <Date :date="primaryChapter(chapter)!.chapter.createdAt" utc format="r" />
                    <button
                        v-if="hasVersions(chapter)"
                        class="drawer-toggle"
                        :title="chapter.open ? 'Collapse versions' : 'Expand versions'"
                        @click="chapter.open = !chapter.open"
                    >
                        <Icon>{{ chapter.open ? 'expand_less' : 'expand_more' }}</Icon>
                    </button>
                </div>
            </div>

            <div v-if="chapter.open" class="version-list">
                <NuxtLink
                    v-for="part in secondaryChapters(chapter)"
                    :key="part.chapter.id"
                    class="chapter-row version"
                    :class="[partStatus(part), { 'without-status': !canRead }]"
                    :to="chapterUrl(part)"
                    :target="chapterTarget(part)"
                >
                    <span v-if="canRead" class="status-dot small">
                        <Icon v-if="partStatus(part) === 'read'" size="11px" unsize>check</Icon>
                        <Icon v-else-if="partStatus(part) === 'current'" size="11px" unsize>play_arrow</Icon>
                    </span>
                    <span class="chapter-number">Ch.{{ part.chapter.ordinal }}</span>
                    <strong>{{ part.chapter.title || chapterTitle(part.chapter) }}</strong>
                    <small v-if="part.chapter.pageCount">{{ part.chapter.pageCount }}p</small>
                    <Date
                        class="version-date"
                        :date="part.chapter.createdAt"
                        utc
                        format="r"
                    />
                </NuxtLink>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { MangaVolumes, ProgressChapter, VolumeChapter } from '~/models';

const { chapterTitle } = useMangaUtils();
const { progress } = useCurrentManga();
const { canRead } = useAuthHelper();

const props = defineProps<{
    chapters: VolumeChapter[];
    chapterMap?: MangaVolumes['chapters'];
    reverse?: boolean;
}>();

const displayedChapters = computed(() => {
    const chapters = [...props.chapters];
    return props.reverse ? chapters.reverse() : chapters;
});

const chapterIds = (chapter: VolumeChapter) => [
    ...chapter.whole,
    ...chapter.partial.flatMap(part => part.versions)
];

const fullChapters = (chapter: VolumeChapter) => chapterIds(chapter)
    .map(id => props.chapterMap?.[id])
    .filter((t): t is ProgressChapter => !!t);

const primaryChapter = (chapter: VolumeChapter) => fullChapters(chapter)[0];
const secondaryChapters = (chapter: VolumeChapter) => fullChapters(chapter).slice(1);
const hasVersions = (chapter: VolumeChapter) => secondaryChapters(chapter).length > 0;
const chapterUrl = (chapter: ProgressChapter) => {
    if (!canRead.value)
        return chapter.chapter.externalUrl ?? chapter.chapter.url ?? `/chapter/${chapter.chapter.id}`;

    const page = chapter.progress?.pageOrdinal;
    return page ? `/chapter/${chapter.chapter.id}?page=${page}` : `/chapter/${chapter.chapter.id}`;
};
const chapterTarget = (chapter: ProgressChapter) => !canRead.value && (chapter.chapter.externalUrl || chapter.chapter.url)
    ? '_blank'
    : undefined;

const partStatus = (chapter: ProgressChapter) => {
    if (!canRead.value) return 'unread';
    if (chapter.chapter.id === progress.value?.entity.lastReadChapterId) return 'current';
    if (chapter.progress?.lastRead) return 'read';
    return 'unread';
};

const status = (chapter: VolumeChapter) => {
    if (!canRead.value) return 'unread';
    if (fullChapters(chapter).some(t => partStatus(t) === 'current')) return 'current';
    if (chapter.progress >= 100 || fullChapters(chapter).some(t => partStatus(t) === 'read')) return 'read';
    return 'unread';
};
</script>

<style scoped lang="scss">
.chapter-list {
    border-top: 1px solid rgba(255, 255, 255, .08);
}

.chapter-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: .75rem;
    align-items: center;
    min-height: 46px;
    padding: 0 .65rem 0 0;
    border-left: 2px solid transparent;
    border-bottom: 1px solid rgba(255, 255, 255, .06);
    color: var(--color);
    text-decoration: none;

    &:hover {
        background: rgba(255, 255, 255, .04);
    }

    &.current {
        border-left-color: var(--color-primary);
        background: rgba(114, 106, 228, .08);
    }

    &.read strong {
        color: var(--color-muted-light);
    }

    .chapter-link {
        display: grid;
        grid-template-columns: 24px 58px minmax(0, 1fr);
        gap: .75rem;
        align-items: center;
        min-width: 0;
        min-height: 46px;
        padding: .65rem 0 .65rem .9rem;
        color: inherit;
        text-decoration: none;

        &.without-status {
            grid-template-columns: 58px minmax(0, 1fr);
        }
    }

    strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: .92rem;
    }

    small,
    .chapter-number,
    :deep(time) {
        color: var(--color-muted-light);
        font-size: .72rem;
    }

    .chapter-meta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: .65rem;
        min-width: 0;
    }

    em {
        padding: .15rem .45rem;
        border-radius: var(--brd-radius);
        background: rgba(114, 106, 228, .18);
        color: var(--color-primary);
        font-size: .68rem;
        font-style: normal;
        text-transform: uppercase;
    }

    .status-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        min-width: 20px;
        height: 20px;
        min-height: 20px;
        border: 1px solid rgba(255, 255, 255, .22);
        border-radius: 50%;

        &.small {
            width: 16px;
            min-width: 16px;
            height: 16px;
            min-height: 16px;
        }
    }

    .drawer-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        min-width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: var(--brd-radius);
        background: transparent;
        color: var(--color-muted-light);

        &:hover {
            background: rgba(255, 255, 255, .07);
            color: var(--color);
            cursor: pointer;
        }
    }

    &.read .status-dot {
        border-color: rgba(114, 106, 228, .65);
        background: rgba(114, 106, 228, .18);
        color: var(--color-primary);
    }

    &.current .status-dot {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: #fff;
    }
}

.version-list .chapter-row {
    grid-template-columns: 20px 58px minmax(0, 1fr) auto auto;
    min-height: 38px;
    padding: .5rem .9rem .5rem 3.25rem;

    &.without-status {
        grid-template-columns: 58px minmax(0, 1fr) auto auto;
    }
}

@media only screen and (max-width: 720px) {
    .chapter-row {
        grid-template-columns: minmax(0, 1fr) auto;

        .chapter-link {
            grid-template-columns: 24px 50px minmax(0, 1fr);

            &.without-status {
                grid-template-columns: 50px minmax(0, 1fr);
            }
        }

        .chapter-meta small,
        .chapter-meta :deep(time) {
            display: none;
        }

        .version-list .version-date {
            display: none;
        }
    }
}

@media only screen and (max-width: 460px) {
    .chapter-row em {
        display: none;
    }
}
</style>
