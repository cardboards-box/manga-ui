import type {
    Manga, MangaVolumed,
    MangaVolume, MangaVolumeChapter,
    VolumeSort, Rect, Regions, Chapter
} from "~/models";

type Ids = {
    mangaId: string | number;
    chapterId: number;
    pageIndex: number;
}

type Target = {
    volume: MangaVolume;
    chapter: MangaVolumeChapter;
    version: Chapter;
}

type TargetIndex = Target & {
    pages: string[];
    pageIndex: number;
}

type CurrentDetails = Target & {
    manga: Manga;
    volumed: MangaVolumed;
    volumeIndex: number;
    chapterIndex: number;
    versionIndex: number;
};

type Output = Ids & CurrentDetails & {
    pages: string[];
    next?: TargetIndex;
    prev?: TargetIndex;
    page: string;
    nextPage?: string;
};

type ErroredOutput = {
    output?: Output;
    error?: string;
}

type LinkTypes =
    'NextChapter' | 'PrevChapter' |
    'ChapterStart' | 'ChapterEnd' |
    'NextPage' | 'PrevPage';

export const useReaderHelper = () => {
    const route = useRoute();
    const { volumed, pages } = useMangaApi();
    const { regionMargin } = useAppSettings();
    const { token } = useSettingsHelper();
    const { proxy } = useApiHelper();

    const cache = useState<MangaVolumed | undefined>('reader-cache', () => undefined);
    const output = useState<ErroredOutput | undefined>('reader-manga', () => undefined);
    const params = useState<{ sort: VolumeSort, asc: boolean }>('reader-params', () => ({ sort: 'ordinal', asc: true }));
    const unauthed = useState<boolean>('reader-unauthed', () => true);
    const retrigger = useState<boolean>('reader-retrigger', () => false);
    const loading = useState<boolean>('reader-loading', () => false);
    const regions = computed(() => {
        const margin = regionMargin.value;
        const w = (100 / 2) - (margin / 2);
        const regions: Rect[] = [
            { x: 0, y: 0, width: 100, height: w, name: 'top' },
            { x: 0, y: 100 - w, width: 100, height: w, name: 'bottom' },
            { x: 0, y: 0, width: w, height: 100, name: 'left' },
            { x: 100 - w, y: 0, width: w, height: 100, name: 'right' },
            { x: w, y: w, width: 100 - (w * 2), height: 100 - (w * 2), name: 'center' }
        ];

        return regions;
    });

    const useCache = (id: number | string, manga?: Manga) => {
        if (unauthed.value) return false;
        return manga?.id == id || manga?.hashId == id;
    }

    const inRegions = (event: MouseEvent) => {
        const output: Regions[] = [];
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 100;
        const y = (event.clientY - rect.top) / rect.height * 100;

        for(let reg of regions.value) {
            if (x >= reg.x && x <= reg.x + reg.width &&
                y >= reg.y && y <= reg.y + reg.height)
                output.push(reg.name);
        }

        return output;
    }

    const getManga = async (id: number | string, force: boolean) => {
        if (!force && useCache(id, cache.value?.manga)) return cache.value!;

        const { data, error: err } = await volumed(id, params);
        if (err.value || !data.value) return undefined;
        cache.value = data.value;
        return {...data.value };
    }

    const getChapter = (volumed: MangaVolumed, chapterId: number): CurrentDetails | undefined => {
        for(let v = 0; v < volumed.volumes.length; v++) {
            const volume = volumed.volumes[v];

            for(let c = 0; c < volume.chapters.length; c++) {
                const chapter = volume.chapters[c];

                for(let t = 0; t < chapter.versions.length; t++) {
                    const version = chapter.versions[t];
                    if (version.id !== chapterId) continue;

                    return {
                        manga: volumed.manga,
                        volumed,
                        volume,
                        chapter,
                        version,
                        volumeIndex: v,
                        chapterIndex: c,
                        versionIndex: t
                    };
                }
            }
        }

        return undefined;
    }

    const getPages = async (chapter: Chapter, manga: Manga) => {
        const doProxy = (urls: string[]) => urls.map(t => proxy(t, 'manga-page', manga.referer));

        if (chapter.pages && chapter.pages.length > 0) return doProxy(chapter.pages);

        const { data, error: err } = await pages(chapter.mangaId, chapter.id);
        if (err.value || !data.value) return [];

        chapter.pages = [...data.value];
        return doProxy(chapter.pages);
    }

    const determineBestVersion = (data: CurrentDetails, chapter: MangaVolumeChapter) => {
        const KEY = 'Scanlation Group';

        if (chapter.versions.length === 0) return undefined;
        if (chapter.versions.length === 1) return chapter.versions[0];

        const group = data.version.attributes.find(t => t.name === KEY);
        if (!group) return chapter.versions[0];

        const version = chapter.versions.find(t => t.attributes.find(a => a.name === KEY && a.value === group.value));
        return version || chapter.versions[0];
    }

    const getNextData = (data: CurrentDetails, offset: number): Target | undefined => {
        const { volumed, volume, chapterIndex, volumeIndex } = data;

        let chapter = volume.chapters[chapterIndex + offset];
        if (chapter) {
            let version = determineBestVersion(data, chapter);
            return version ? { volume, chapter, version } : undefined;
        }

        const nextVolume = volumed.volumes[volumeIndex + offset];
        if (!nextVolume) return undefined;

        chapter = nextVolume.chapters[offset > 0 ? 0 : nextVolume.chapters.length - 1];
        if (!chapter) return undefined;

        const version = determineBestVersion(data, chapter);
        if (!version) return undefined;
        return { volume: nextVolume, chapter, version };
    }

    const getNext = async (data: CurrentDetails, offset: number): Promise<TargetIndex | undefined> => {
        const next = getNextData(data, offset);
        if (!next) return undefined;

        const pages = await getPages(next.version, data.manga);
        if (pages.length === 0) return undefined;

        const pageIndex = offset > 0 ? 0 : pages.length - 1;
        return {
            ...next,
            pages,
            pageIndex
        };
    }

    const execute = async (inputIds?: Ids, force?: boolean): Promise<ErroredOutput> => {
        const ids = inputIds ?? {
            mangaId: route.params.id.toString(),
            chapterId: +(route.params.chapter.toString() || '0'),
            pageIndex: (+(route.query.page?.toString() || '1')) - 1
        };
        let pageIndex = ids.pageIndex;
        const manga = await getManga(ids.mangaId, force ?? false);
        unauthed.value = !process.client || !token.value;
        if (!manga) return { error: 'Manga not found!' };

        const data = getChapter(manga, ids.chapterId);
        if (!data) return { error: 'Chapter not found!' };

        const [ pages, next, prev ] = await Promise.all([
            getPages(data.version, manga.manga),
            getNext(data, 1),
            getNext(data, -1)
        ]);

        if (pages.length === 0) return { error: 'No Pages Found!' };
        if (pageIndex >= pages.length) pageIndex = pages.length - 1;
        if (pageIndex < 0) pageIndex = 0;

        return {
            output: {
                ...ids,
                ...data,
                pages,
                next,
                prev,
                page: pages[pageIndex],
                nextPage: pages[pageIndex + 1] ?? next?.pages[next.pageIndex],
                pageIndex,
            }
        };
    }

    const doExecute = async (force: boolean, ids?: Ids) => {
        loading.value = true;
        output.value = await execute(ids, force);
        retrigger.value = !retrigger.value;
        loading.value = false;
        return output.value;
    }

    const doMask = (m: string | number, c?: number, p?: number, mask?: string) => {
        if (c === undefined || p === undefined) return undefined;

        return (mask ?? '/manga/:id/:chap?page=:page')
            .replace(':id', m.toString())
            .replace(':chap', c.toString())
            .replace(':page', (p + 1).toString());
    }

    const genLink = (type: LinkTypes, data?: Output, mask?: string) => {
        const item = data ?? output.value?.output;
        if (!item) return undefined;

        const { mangaId, chapterId, pageIndex, next, prev, pages } = item;

        switch(type) {
            case 'ChapterEnd': return doMask(mangaId, chapterId, pages.length - 1, mask);
            case 'ChapterStart': return doMask(mangaId, chapterId, 0, mask);
            case 'NextChapter': return next ? doMask(mangaId, next?.version.id, next.pageIndex, mask) : undefined;
            case 'PrevChapter': return prev ? doMask(mangaId, prev?.version.id, prev.pageIndex, mask) : undefined;
            case 'NextPage':
                return (pages[pageIndex + 1])
                    ? doMask(mangaId, chapterId, pageIndex + 1, mask)
                    : doMask(mangaId, next?.version.id, next?.pageIndex, mask);
            case 'PrevPage':
                return (pages[pageIndex - 1])
                    ? doMask(mangaId, chapterId, pageIndex - 1, mask)
                    : doMask(mangaId, prev?.version.id, prev?.pageIndex, mask);
        }
    }

    const genPageLink = (page: number, data?: Output, mask?: string) => {
        const item = data ?? output.value?.output;
        if (!item) return undefined;

        const { mangaId, chapterId } = item;
        return doMask(mangaId, chapterId, page, mask);
    }

    return {
        data: computed(() => output.value?.output),
        error: computed(() => output.value?.error),
        retrigger,
        fetch: (ids?: Ids) => doExecute(false, ids),
        refresh: (ids?: Ids) => doExecute(true, ids),
        unauthed,
        loading,
        regions,
        inRegions,
        doMask,
        genLink,
        genPageLink,
        determineBestVersion,
    }
}
