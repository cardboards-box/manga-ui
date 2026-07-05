<template>
    <section class="chapters-tab">
        <header>
            <div v-if="canRead" class="chapter-progress-summary">
                <span>
                    <strong>{{ readCount }}</strong>
                    of
                    <strong>{{ totalCount }}</strong>
                    chapters read
                </span>
                <span>{{ percentRead.toFixed(0) }}%</span>
            </div>
            <SelectBox v-model="chapterStyle" transparent>
                <option v-for="style in CHAPTER_STYLES" :key="style.value" :value="style.value">
                    {{ style.name }}
                </option>
            </SelectBox>
        </header>

        <Error v-if="!volumes || volumes.volumes.length === 0" message="Manga has no chapters!" />

        <ChapterList
            v-else-if="isFlatList"
            :volumes="volumes"
            :reverse="isReversed"
        />
        <ChapterVolumeList
            v-else
            :volumes="volumes"
            :cover="cover"
            :covers="covers"
            :reverse="isReversed"
        />
    </section>
</template>

<script setup lang="ts">
import { CHAPTER_STYLES, ChapterStyle } from '~/models';
import type { MangaVolume, MangaVolumes, MbImage, ProgressChapter, VolumeChapter } from '~/models';
import ChapterList from './ChapterList.vue';
import ChapterVolumeList from './ChapterVolumeList.vue';

const { canRead } = useAuthHelper();
const { progress } = useCurrentManga();
const { chapterStyle } = useAppSettings();

const props = defineProps<{
    volumes?: MangaVolumes;
    cover?: MbImage;
    covers?: MbImage[];
}>();

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

const totalCount = computed(() => props.volumes?.volumes.reduce((sum, volume) => sum + volume.chapters.length, 0) ?? 0);
const readCount = computed(() => props.volumes?.volumes.reduce((sum, volume) => sum + volumeReadCount(volume), 0) ?? 0);
const percentRead = computed(() => totalCount.value ? (readCount.value / totalCount.value) * 100 : 0);
const isChapterStarted = (chapter: VolumeChapter) => ['read', 'current'].includes(status(chapter));
const volumeReadCount = (volume: MangaVolume) => volume.chapters.filter(isChapterStarted).length;
const isFlatList = computed(() => [ChapterStyle.Chapters, ChapterStyle.ChaptersReversed].includes(chapterStyle.value));
const isReversed = computed(() => [ChapterStyle.VolumesReversed, ChapterStyle.ChaptersReversed].includes(chapterStyle.value));
</script>

<style scoped lang="scss">
.chapters-tab {
    header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        color: var(--color-muted-light);

        .chapter-progress-summary {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            min-width: 0;
        }

        strong,
        span:last-child {
            color: var(--color);
        }

        span:last-child {
            color: var(--color-primary);
        }

        .select-styled {
            min-width: 180px;
        }
    }
}

@media only screen and (max-width: 720px) {
    .chapters-tab header {
        grid-template-columns: 1fr;
    }
}
</style>
