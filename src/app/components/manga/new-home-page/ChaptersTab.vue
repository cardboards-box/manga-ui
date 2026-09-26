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
            <div class="chapter-list-controls">
                <IconBtn
                    v-if="canRead"
                    class="chapter-read-filter"
                    :icon="activeReadFilter.icon"
                    :title="activeReadFilter.title"
                    :class="{ active: chapterReadFilter !== ChapterReadFilter.All }"
                    icon-size="20px"
                    @click="cycleReadFilter"
                />
                <SelectBox v-model="chapterStyle" transparent>
                    <option v-for="style in CHAPTER_STYLES" :key="style.value" :value="style.value">
                        {{ style.name }}
                    </option>
                </SelectBox>
            </div>
        </header>

        <Error v-if="!volumes || volumes.volumes.length === 0" message="Manga has no chapters!" />
        <Error
            v-else-if="chapterReadFilter !== ChapterReadFilter.All && filteredChapterCount === 0"
            :message="`No ${chapterReadFilter} chapters found.`"
        />

        <ChapterList
            v-else-if="isFlatList"
            :volumes="volumes"
            :reverse="isReversed"
            :read-filter="chapterReadFilter"
        />
        <ChapterVolumeList
            v-else
            :volumes="volumes"
            :cover="cover"
            :covers="covers"
            :reverse="isReversed"
            :read-filter="chapterReadFilter"
        />
    </section>
</template>

<script setup lang="ts">
import { CHAPTER_STYLES, ChapterReadFilter, ChapterStyle } from '~/models';
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

const readFilters = [
    {
        value: ChapterReadFilter.All,
        icon: 'filter_alt',
        title: 'Showing all chapters',
    }, {
        value: ChapterReadFilter.Read,
        icon: 'check_circle',
        title: 'Showing read chapters only',
    }, {
        value: ChapterReadFilter.Unread,
        icon: 'radio_button_unchecked',
        title: 'Showing unread chapters only',
    }
];

const chapterReadFilter = ref<ChapterReadFilter>(ChapterReadFilter.All);
const activeReadFilter = computed(() => readFilters.find(filter => filter.value === chapterReadFilter.value) ?? readFilters[0]!);

const cycleReadFilter = () => {
    const index = readFilters.findIndex(filter => filter.value === chapterReadFilter.value);
    chapterReadFilter.value = readFilters[(index + 1) % readFilters.length]!.value;
};

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
const filteredChapterCount = computed(() => props.volumes?.volumes.reduce((sum, volume) => sum + volume.chapters.filter(matchesReadFilter).length, 0) ?? 0);
const isFlatList = computed(() => [ChapterStyle.Chapters, ChapterStyle.ChaptersReversed].includes(chapterStyle.value));
const isReversed = computed(() => [ChapterStyle.VolumesReversed, ChapterStyle.ChaptersReversed].includes(chapterStyle.value));

function matchesReadFilter(chapter: VolumeChapter) {
    if (chapterReadFilter.value === ChapterReadFilter.All) return true;
    return isChapterStarted(chapter) === (chapterReadFilter.value === ChapterReadFilter.Read);
}

watch(canRead, value => {
    if (!value) chapterReadFilter.value = ChapterReadFilter.All;
});
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

            strong,
            > span:last-child {
                color: var(--color);
            }

            > span:last-child {
                color: var(--color-primary);
            }
        }

        .chapter-list-controls {
            display: flex;
            align-items: center;
            gap: .5rem;
        }

        .chapter-read-filter.active {
            outline: 1px solid var(--color-primary);
            outline-offset: -1px;
        }

        .chapter-list-controls .select-styled {
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
