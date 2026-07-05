<template>
    <article
        v-for="(volume, index) in displayedVolumes"
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

        <ChapterRows
            v-if="!volume.collapse"
            :chapters="volume.chapters"
            :chapter-map="volumes?.chapters"
            :reverse="reverse"
        />
    </article>
</template>

<script setup lang="ts">
import { VolumeState } from '~/models';
import type { MangaVolume, MangaVolumes, MbImage, ProgressChapter, VolumeChapter } from '~/models';
import ChapterRows from './ChapterRows.vue';

const { progress } = useCurrentManga();
const { canRead } = useAuthHelper();

const props = defineProps<{
    volumes?: MangaVolumes;
    cover?: MbImage;
    covers?: MbImage[];
    reverse?: boolean;
}>();

const initializedKey = ref<string>();

const displayedVolumes = computed(() => {
    const volumes = [...(props.volumes?.volumes ?? [])];
    return props.reverse ? volumes.reverse() : volumes;
});

const chapterIds = (chapter: VolumeChapter) => [
    ...chapter.whole,
    ...chapter.partial.flatMap(part => part.versions)
];

const fullChapters = (chapter: VolumeChapter) => chapterIds(chapter)
    .map(id => props.volumes?.chapters[id])
    .filter((t): t is ProgressChapter => !!t);

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
        props.reverse ? 'reversed' : 'normal',
        vols.map((volume, index) => `${volume.ordinal ?? index}:${volume.chapters.length}`).join('|')
    ].join(':');
    if (initializedKey.value === key) return;

    const currentVolume = vols.find(volume => volumeHasChapter(volume, lastReadChapterId));
    const openVolume = currentVolume ?? displayedVolumes.value[0];

    for (const volume of vols)
        volume.collapse = volume !== openVolume;

    initializedKey.value = key;
};

const isChapterStarted = (chapter: VolumeChapter) => ['read', 'current'].includes(status(chapter));
const volumeReadCount = (volume: MangaVolume) => volume.chapters.filter(isChapterStarted).length;
const volumePercent = (volume: MangaVolume) => volume.chapters.length ? (volumeReadCount(volume) / volume.chapters.length) * 100 : 0;

watch(
    [() => props.volumes, () => props.reverse, () => progress.value?.entity.lastReadChapterId],
    () => initializeOpenVolume(),
    { immediate: true }
);
</script>

<style scoped lang="scss">
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

@media only screen and (max-width: 460px) {
    .volume-card .volume-progress div {
        display: none;
    }
}
</style>
