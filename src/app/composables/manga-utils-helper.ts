import { ContentRating, VolumeState } from '../models';
import type { MangaBoxType, MangaVolumes, MbChapter, MbManga, MbMangaExt, MbTypeManga, MbTypeMangaSearch, MbTypeProgress, ProgressChapter } from '../models';

type ExplodeKey<T extends MangaBoxType<any, any>> = T['related'][number]['type'];

type RelatedByKey<
  T extends MangaBoxType<any, any>,
  K extends ExplodeKey<T>
> = Extract<T["related"][number], { type: K }>;

type DataByKey<
  T extends MangaBoxType<any, any>,
  K extends ExplodeKey<T>
> = NonNullable<RelatedByKey<T, K>["data"]>;

type Progress = {
    total: number,
    totalSlug: string,
    manga: number,
    mangaSlug: string,
    volume: number,
    volumeSlug: string,
    chapter: number,
    chapterSlug: string
}

export function useMangaUtils() {
    const { clamp } = useUtils();
    const { blurPornCovers, proxyUrl } = useAppSettings();
    const defaultProxyUrl = 'https://cba-proxy.index-0.com';

    /**
     * Gets the manga from the given types
     * @param item The various types that contain manga data
     * @returns The manga data
     */
    function getManga(item: MbTypeManga | MbTypeMangaSearch | MbManga) {
        return 'id' in item ? item : item.entity;
    }

    /**
     * Whether or not the given image should be blurred
     * @param check The manga item to check
     * @returns Whether or not to blue the image
     */
    function shouldBlur(check?: MbTypeManga | MbTypeMangaSearch | MbManga | ContentRating) {
        if (check === undefined || check === null) return false;
        const rating = typeof check === 'number' ? check : getManga(check).contentRating;
        return blurPornCovers.value && rating === ContentRating.Pornographic;
    }

    /**
     * Gets the data from the related items
     * @param item The item containing the related data
     * @param key The key of the related data
     * @returns The related data or undefined if not found
     */
    function getRelated<
        T extends MangaBoxType<any, any>,
        const K extends ExplodeKey<T>
    >(item: T, key: K): DataByKey<T, K> | undefined {
        return item.related.find(r => r.type === key)?.data;
    }

    /**
     * Checks if the related item is of the specified type
     * @param key The key of the related data
     * @returns A type guard function
     */
    function isRelatedType<
        T extends MangaBoxType<any, any>,
        K extends ExplodeKey<T>
    >(key: K) {
        return (r: T["related"][number]): r is RelatedByKey<T, K> => r.type === key;
    }

    /**
     * Gets all of the related data of the specified type
     * @param item The item containing the related data
     * @param key The key of the related data
     * @returns The related data
     */
    function getRelateds<
        T extends MangaBoxType<any, any>,
        const K extends ExplodeKey<T>
    >(item: T, key: K): DataByKey<T, K>[] {
        return item.related
            .filter(isRelatedType<T, K>(key))
            .map(r => r.data)
            .filter((d): d is DataByKey<T, K> => d != null);
    }

    /**
     * Proxies the given URL through the configured proxy
     * @param url The URL to proxy
     * @param group The group for the proxy
     * @param referer The referer for the proxy
     * @returns The proxied URL
     */
    function proxy(url: string, group: string = 'manga-page', referer?: string) {
        const path = encodeURIComponent(url);
        const refererParam = referer ? encodeURIComponent(referer) : '';
        const defProxy = defaultProxyUrl.endsWith('/') ? defaultProxyUrl : `${defaultProxyUrl}/`;

        const uri = proxyUrl.value || `${defProxy}proxy?path={image}&group={group}&referer={referer}`;
        return uri
            .replace('{image}', path)
            .replace('{group}', group)
            .replace('{referer}', refererParam)
            .trim();
    }

    /**
     * Merges the given progress data into the manga volumes
     * @param volumes The manga volumes to merge progress into
     * @param progress The progress data to merge
     */
    function mergeProgress(volumes: MangaVolumes | undefined, progress: MbTypeProgress) {
        function determineChapterProgress(chapter: ProgressChapter) {
            if (!chapter.progress?.pageOrdinal) return 0;

            const pageCount = chapter.chapter.pageCount ?? 0;
            if (chapter.progress.pageOrdinal >= pageCount) return 100;

            const result = clamp((chapter.progress.pageOrdinal / pageCount) * 100, 0, 100);
            return +(result.toFixed(2));
        }

        if (!volumes || !progress.entity ||
            (volumes.progress?.mangaId && volumes.progress?.mangaId !== progress.entity.mangaId))
            return;

        volumes.progress = progress.entity;
        const chapters = getRelateds(progress, 'MbChapterProgress');

        for(const chapter of chapters) {
            if (!volumes.chapters[chapter.chapterId]) continue;

            volumes.chapters[chapter.chapterId]!.progress = chapter;
        }

        for(const volume of volumes.volumes) {
            let readCount = 0;
            for(const chapter of volume.chapters) {
                const readChapters = chapter.versions
                    .map(t => volumes!.chapters[t]!)
                    .filter(t => t && t.progress?.lastRead);
                if (readChapters.length === 0) continue;

                chapter.progress = determineChapterProgress(readChapters[0]!);
                readCount += chapter.progress > 0 ? 1 : 0;
            }

            volume.state = readCount === 0 ? VolumeState.NotStarted
                : readCount === volume.chapters.length ? VolumeState.Completed
                : VolumeState.InProgress;
        }
    }

    /**
     * Determines the title for a chapter
     * @param chapter The chapter
     * @returns The chapter title
     */
    function chapterTitle(chapter: MbChapter) {
        let output = '';
        if (chapter.volume) output += `Vol. ${chapter.volume} `;
        output += `Ch. ${chapter.ordinal} `;
        if (chapter.title) output += `- ${chapter.title}`;
        return output.trim();
    }

    /**
     * Calculates the progress through a manga
     * @param volumes The volume data
     * @param extended The extended manga data
     * @param pages The number of pages in the chapter
     * @returns The progress data
     */
    function calculateProgress(volumes: MangaVolumes | undefined, extended: MbMangaExt | undefined, pages: number): Progress {
        const DEFAULT = {
            total: 0,
            totalSlug: '',
            manga: 0,
            mangaSlug: '',
            volume: 0,
            volumeSlug: '',
            chapter: 0,
            chapterSlug: ''
        };

        const mangaProgress = volumes?.progress;
        const currentChapId = mangaProgress?.lastReadChapterId;
        if (!volumes || !extended || !mangaProgress || !currentChapId) return DEFAULT;

        const chapter = volumes.chapters[currentChapId];
        const currentVolume = volumes.volumes.find(t => t.chapters.some(c => c.versions.includes(currentChapId)));
        const currentChapter = currentVolume?.chapters.find(c => c.versions.includes(currentChapId));
        if (!currentVolume || !currentChapter || !chapter) return DEFAULT;

        const totalProgress = mangaProgress.progressPercentage;
        const totalSlug = `${mangaProgress.lastReadOrdinal}/${extended.uniqueChapterCount} (${totalProgress.toFixed(2)}%)`;

        const volumeCount = volumes.volumes.length;
        const volumeIndex = volumes.volumes.indexOf(currentVolume) + 1;
        const volumeProgress = volumeIndex / volumeCount * 100;
        const volumeSlug = `${volumeIndex}/${volumeCount} (${volumeProgress.toFixed(2)}%)`;

        const chapterCount = currentVolume.chapters.length;
        const chapterIndex = currentVolume.chapters.indexOf(currentChapter) + 1;
        const chapterProgress = chapterIndex / chapterCount * 100;
        const chapterSlug = `${chapterIndex}/${chapterCount} (${chapterProgress.toFixed(2)}%)`;

        const pageCount = chapter.chapter.pageCount || pages;
        const pageIndex = chapter.progress?.pageOrdinal ?? 0;
        const pageProgress = pageIndex / pageCount * 100;
        const pageSlug = `${pageIndex}/${pageCount} (${pageProgress.toFixed(2)}%)`;

        return {
            total: totalProgress,
            totalSlug,
            manga: volumeProgress,
            mangaSlug: volumeSlug,
            volume: chapterProgress,
            volumeSlug: chapterSlug,
            chapter: pageProgress,
            chapterSlug: pageSlug
        }
    }

    return {
        shouldBlur,
        getManga,
        getRelated,
        getRelateds,
        proxy,
        mergeProgress,
        chapterTitle,
        calculateProgress
    }
}
