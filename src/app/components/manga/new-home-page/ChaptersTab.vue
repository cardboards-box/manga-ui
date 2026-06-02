<template>
    <section class="chapters-tab">
        <header v-if="canRead">
            <span>
                <strong>{{ readCount }}</strong>
                of
                <strong>{{ totalCount }}</strong>
                chapters read
            </span>
            <span>{{ percentRead.toFixed(0) }}%</span>
        </header>

        <Error v-if="!volumes || volumes.volumes.length === 0" message="Manga has no chapters!" />

        <article
            v-for="(volume, index) in volumes?.volumes"
            :key="index"
            class="volume-card"
        >
            <button class="volume-header" @click="volume.collapse = !volume.collapse">
                <div class="volume-thumb">
                    <Cover :image="volumeCover(volume)" type="background" width="100%" height="100%" />
                </div>
                <div>
                    <div class="volume-title">
                        <span>{{ volume.ordinal ? `Vol.${volume.ordinal}` : 'No Volume' }}</span>
                        <strong>{{ volume.chapters.length }} chapter{{ volume.chapters.length === 1 ? '' : 's' }}</strong>
                        <em v-if="canRead && volume.state === VolumeState.InProgress">Reading</em>
                    </div>
                    <div v-if="canRead" class="volume-progress">
                        <small>{{ volumeReadCount(volume) }}/{{ volume.chapters.length }} chapters</small>
                        <div><span :style="{ width: volumePercent(volume) + '%' }" /></div>
                        <small>{{ volumePercent(volume).toFixed(0) }}%</small>
                    </div>
                </div>
                <Icon>{{ volume.collapse ? 'expand_more' : 'expand_less' }}</Icon>
            </button>

            <div v-if="!volume.collapse" class="chapter-list">
                <template v-for="chapter in volume.chapters" :key="chapter.ordinal">
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
                        </NuxtLink>
                    </div>
                </template>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
import { VolumeState } from '~/models';
import type { MangaVolume, MangaVolumes, MbImage, ProgressChapter, VolumeChapter } from '~/models';

const { chapterTitle } = useMangaUtils();
const { progress } = useCurrentManga();
const { canRead } = useAuthHelper();

const props = defineProps<{
    volumes?: MangaVolumes;
    cover?: MbImage;
    covers?: MbImage[];
}>();

const initializedKey = ref<string>();

const chapterIds = (chapter: VolumeChapter) => [
    ...chapter.whole,
    ...chapter.partial.flatMap(part => part.versions)
];

const fullChapters = (chapter: VolumeChapter) => chapterIds(chapter)
    .map(id => props.volumes?.chapters[id])
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

const volumeHasChapter = (volume: MangaVolume, id?: string) => !!id && volume.chapters
    .some(chapter => chapterIds(chapter).includes(id));
const volumeCover = (volume: MangaVolume) => props.covers?.find(cover => cover.ordinal === volume.ordinal)
    ?? props.covers?.[0]
    ?? props.cover;

const initializeOpenVolume = () => {
    const vols = props.volumes?.volumes;
    if (!vols?.length) return;

    const lastReadChapterId = progress.value?.entity.lastReadChapterId;
    const key = [
        lastReadChapterId ?? 'first',
        vols.map((volume, index) => `${volume.ordinal ?? index}:${volume.chapters.length}`).join('|')
    ].join(':');
    if (initializedKey.value === key) return;

    const currentVolume = vols.find(volume => volumeHasChapter(volume, lastReadChapterId));
    const openVolume = currentVolume ?? vols[0];

    for (const volume of vols)
        volume.collapse = volume !== openVolume;

    initializedKey.value = key;
};

const totalCount = computed(() => props.volumes?.volumes.reduce((sum, volume) => sum + volume.chapters.length, 0) ?? 0);
const readCount = computed(() => props.volumes?.volumes.reduce((sum, volume) => sum + volumeReadCount(volume), 0) ?? 0);
const percentRead = computed(() => totalCount.value ? (readCount.value / totalCount.value) * 100 : 0);
const volumeReadCount = (volume: MangaVolume) => volume.chapters.filter(chapter => status(chapter) === 'read').length;
const volumePercent = (volume: MangaVolume) => volume.chapters.length ? (volumeReadCount(volume) / volume.chapters.length) * 100 : 0;

watch(
    [() => props.volumes, () => progress.value?.entity.lastReadChapterId],
    () => initializeOpenVolume(),
    { immediate: true }
);
</script>

<style scoped lang="scss">
.chapters-tab {
    header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        color: var(--color-muted-light);

        strong,
        span:last-child {
            color: var(--color);
        }

        span:last-child {
            color: var(--color-primary);
        }
    }
}

.volume-card {
    overflow: hidden;
    margin-bottom: .85rem;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;
    background: rgba(255, 255, 255, .035);

    .volume-header {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        gap: .75rem;
        align-items: center;
        width: 100%;
        padding: .75rem;
        border: 0;
        background: transparent;
        color: var(--color);
        text-align: left;

        &:hover {
            background: rgba(255, 255, 255, .04);
            cursor: pointer;
        }
    }

    .volume-thumb {
        aspect-ratio: 2 / 3;
        overflow: hidden;
        border-radius: 4px;
        background: var(--bg-color-accent-dark);
    }

    .volume-title,
    .volume-progress {
        display: flex;
        align-items: center;
        gap: .5rem;
        min-width: 0;
    }

    .volume-title span {
        color: var(--color-primary);
        font-size: .8rem;
        font-weight: 700;
    }

    .volume-title strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    .volume-progress {
        margin-top: .35rem;

        small {
            color: var(--color-muted-light);
            font-size: .72rem;
        }

        div {
            width: 80px;
            height: 5px;
            overflow: hidden;
            border-radius: 99px;
            background: rgba(255, 255, 255, .1);
        }

        span {
            display: block;
            height: 100%;
            background: var(--color-primary);
        }
    }
}

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
    grid-template-columns: 20px 58px minmax(0, 1fr) auto;
    min-height: 38px;
    padding: .5rem .9rem .5rem 3.25rem;

    &.without-status {
        grid-template-columns: 58px minmax(0, 1fr) auto;
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
    }
}

@media only screen and (max-width: 460px) {
    .volume-card .volume-progress div,
    .chapter-row em {
        display: none;
    }
}
</style>
