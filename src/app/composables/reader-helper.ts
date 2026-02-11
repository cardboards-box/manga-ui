import { ChapterOrderBy } from "~/models";
import type {
    MbTypeChapter, MangaVolumes, MbTypeManga,
    Rect, MbChapter, Regions, MangaVolume,
    MbImage, MbMangaExt, MbMangaProgress, VolumeChapter,
    MbTypeProgress
} from "~/models";

const CACHE_KEY = 'chapter-cache-';
const PRE_LOAD_IMAGES = 5;
const PRE_LOAD_CHAPTERS = 2;

type OrdinalType = 'page' | 'chapter' | 'volume';

type Params = {
    id: string;
    page: number;
}

type PageLink = {
    name: string;
    url: string;
    index: number;
    current: boolean;
}

type PageLinks = {
    volume: PageLink[];
    chapter: PageLink[];
    versions: PageLink[];
    page: PageLink[];
}

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

export function useReaderHelper() {
    const route = useRoute();
    const api = useMangaApi();
    const { throttle } = useUtils();
    const { regionMargin } = useAppSettings();
    const { canRead } = useAuthHelper();
    const { getRelated, getRelateds, mergeProgress, chapterTitle, calculateProgress } = useMangaUtils();
    const { volumes: mvCache } = useCurrentManga();

    const manga = useState<MbTypeManga | undefined>(CACHE_KEY + 'manga', () => undefined);
    const volumes = useState<MangaVolumes | undefined>(CACHE_KEY + 'volumes', () => undefined);
    const fullChapters = useState<Record<string, MbTypeChapter>>('chapter-cache-full-chapters', () => ({}));
    const params = useState<Params | undefined>(CACHE_KEY + 'params', () => undefined);
    const fullChapter = useState<MbTypeChapter | undefined>('chapter-cache-full-chapter', () => undefined);

    const pending = useState<boolean>(CACHE_KEY + 'pending', () => false);
    const error = useState<string | undefined>(CACHE_KEY + 'error', () => undefined);
    const partialLoading = useState<boolean>(CACHE_KEY + 'partial-loading', () => false);

    const mangaProgress = useState<MbMangaProgress | undefined>(CACHE_KEY + 'manga-progress', () => undefined);
    const currentVolume = useState<MangaVolume | undefined>(CACHE_KEY + 'current-volume', () => undefined);
    const currentVolumeChapter = useState<VolumeChapter | undefined>(CACHE_KEY + 'current-volume-chapter', () => undefined);
    const mangaExtended = useState<MbMangaExt | undefined>(CACHE_KEY + 'manga-extended', () => undefined);
    const pages = useState<MbImage[]>(CACHE_KEY + 'pages', () => []);
    const currentPage = useState<MbImage | undefined>(CACHE_KEY + 'current-page', () => undefined);
    const flatChapters = useState<VolumeChapter[]>(CACHE_KEY + 'flat-chapters', () => []);
    const bookmarks = useState<number[]>(CACHE_KEY + 'bookmarks', () => []);
    const preloadPages = useState<MbImage[]>(CACHE_KEY + 'preload-pages', () => []);
    const progress = useState<Progress>(CACHE_KEY + 'progress', () => ({
        total: 0, totalSlug: '',
        manga: 0, mangaSlug: '',
        volume: 0, volumeSlug: '',
        chapter: 0, chapterSlug: ''
    }));
    const selectLinks = useState<PageLinks>(CACHE_KEY + 'selected-links', () => ({
        volume: [],
        chapter: [],
        versions: [],
        page: []
    }));

    const updateProgress = throttle<void>(() => _updateProgress(), 200);

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

    /** Force update all of the cached items */
    function tap() {
        const ACTIONS = [
            () => mangaProgress.value = volumes.value?.progress,
            () => currentVolume.value = !params.value?.id || !volumes.value ? undefined : volumes.value.volumes.find(t => t.chapters.some(c => c.versions.includes(params.value!.id))),
            () => currentVolumeChapter.value = !currentVolume.value || !params.value?.id ? undefined : currentVolume.value.chapters.find(c => c.versions.includes(params.value!.id)),
            () => mangaExtended.value = manga.value ? getRelated(manga.value, 'MbMangaExt') : undefined,
            () => pages.value = fullChapter.value ? getRelateds(fullChapter.value, 'MbImage').toSorted((a,b) => a.ordinal - b.ordinal) : [],
            () => currentPage.value = pages.value.find(t => t.ordinal === params.value?.page),
            () => flatChapters.value = volumes.value ? volumes.value.volumes.flatMap(v => v.chapters).toSorted((a, b) => a.ordinal - b.ordinal) : [],
            () => bookmarks.value = volumes.value?.chapters[params.value?.id ?? '']?.progress?.bookmarks ?? [],
            () => preloadPages.value = (() => {
                if (!currentPage.value || !pages.value.length) return [];

                const sorted = pages.value.toSorted((a, b) => a.ordinal - b.ordinal);
                const currentIndex = sorted.findIndex(p => p.ordinal === currentPage.value!.ordinal);
                const start = Math.max(0, currentIndex - PRE_LOAD_IMAGES);
                const end = Math.min(sorted.length, currentIndex + PRE_LOAD_IMAGES + 1);
                return sorted.slice(start, end);
            })(),
            () => progress.value = calculateProgress(volumes.value, mangaExtended.value, pages.value.length),
            () => selectLinks.value = (() => {
                const volumeLinks = (() => {
                    if (!volumes.value ||
                        !currentVolume.value ||
                        volumes.value.volumes.length <= 0)
                        return [];

                    const output: PageLink[] = [];
                    for(let i = 0; i < volumes.value.volumes.length; i++) {
                        const v = volumes.value.volumes[i]!;
                        if (v.chapters.length === 0) continue;

                        const best = findBestChapter(fullChapter.value!, v.chapters[0]!.versions);
                        if (!best) continue;

                        output.push({
                            name: v.ordinal === undefined ? 'No Volume #' : `Vol. ${v.ordinal}`,
                            url: `/chapter/${best.id}?page=1`,
                            index: i,
                            current: v === currentVolume.value
                        });
                    }
                    return output;
                })();
                const chapterLinks = (() => {
                    if (!currentVolume.value ||
                        !currentVolumeChapter.value ||
                        currentVolume.value.chapters.length <= 0)
                        return [];

                    const output: PageLink[] = [];
                    for(let i = 0; i < currentVolume.value.chapters.length; i++) {
                        const c = currentVolume.value.chapters[i]!;
                        const best = findBestChapter(fullChapter.value!, c.versions);
                        if (!best) continue;

                        output.push({
                            name: chapterTitle(best),
                            url: `/chapter/${best.id}?page=1`,
                            index: i,
                            current: c === currentVolumeChapter.value
                        });
                    }
                    return output;
                })();
                const versionLinks = (() => {
                    if (!currentVolumeChapter.value ||
                        currentVolumeChapter.value.versions.length <= 1)
                        return [];

                    const output: PageLink[] = [];
                    for(let i = 0; i < currentVolumeChapter.value.versions.length; i++) {
                        const v = currentVolumeChapter.value.versions[i]!;
                        const c = volumes.value?.chapters[v];
                        if (!c) continue;

                        output.push({
                            name: chapterTitle(c.chapter),
                            url: `/chapter/${c.chapter.id}?page=1`,
                            index: i,
                            current: v === fullChapter.value?.entity.id
                        });
                    }
                    return output;
                })();
                const pageLinks = (() => {
                    if (pages.value.length <= 1 || !params.value) return [];

                    const output: PageLink[] = [];

                    for(let i = 0; i < pages.value.length; i++) {
                        const p = pages.value[i]!;
                        output.push({
                            name: `Page ${p.ordinal}`,
                            url: `/chapter/${fullChapter.value!.entity.id}?page=${p.ordinal}`,
                            index: i,
                            current: p.ordinal === params.value.page
                        });
                    }

                    return output;
                })();
                return {
                    volume: volumeLinks,
                    chapter: chapterLinks,
                    versions: versionLinks,
                    page: pageLinks
                }
            })()
        ];

        for(const action of ACTIONS) action();
    }

    /**
     * Checks to see if the mouse click is within the reader regions
     * @param event The mouse click event
     * @returns The regions the click is within
     */
    function inRegions(event: MouseEvent) {
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

    /**
     * Fetches the current route's parameters
     * @returns The current route's parameters
     */
    function getRouteParams(): Params {
        return {
            id: route.params.id!.toString(),
            page: +(route.query.page?.toString() ?? '1')
        }
    }

    /**
     * Whether or not the cache can be used for the current parameters
     * @param pars The parameters to check against the cache
     * @param force Whether or not to force bypass the cache
     * @returns Whether or not the cache can be used
     */
    function shouldUseChapterCache(pars: Params, force: boolean) {
        if (force || !fullChapter.value || error.value) return false;

        return fullChapter.value.entity.id === pars.id;
    }

    /**
     * Whether or not the cache can be used for the current manga
     * @param force Whether or not to force bypass the cache
     * @returns Whether or not the cache can be used
     */
    function shouldUseMangaCache(force: boolean) {
        if (force || !manga.value || !volumes.value || error.value) return false;

        return manga.value.entity.id === fullChapter.value?.entity.mangaId;
    }

    /**
     * Fetches the data for the chapter from the API
     * @param force Whether or not to force refresh the data
     * @returns A promise that resolves when the data has been fetched and processed
     */
    async function fetch(force: boolean = false) {
        if (pending.value) return;

        const pars = getRouteParams();
        params.value = pars;
        if (!canRead.value || !pars.id) {
            error.value = 'This chapter does not exist!';
            return;
        }

        error.value = undefined;

        if (!shouldUseChapterCache(pars, force)) {
            pending.value = true;
            const fc = await api.promise.chapter.fetch(pars.id);
            if (!api.isSuccess(fc)) {
                error.value = 'Failed to load chapter! ' + api.errorMessage(fc);
                pending.value = false;
                return;
            }

            fullChapters.value[pars.id] = api.data(fc);
        }

        fullChapter.value = fullChapters.value[pars.id];

        if (!fullChapter.value || !fullChapter.value.entity.mangaId) {
            error.value = 'This chapter does not exist!';
            pending.value = false;
            afterNav();
            return;
        }

        if (pars.page <= 0) {
            pars.page = params.value.page = getRelateds(fullChapter.value, 'MbImage')
                .toSorted((a,b) => b.ordinal - a.ordinal)[0]?.ordinal ?? 1;
        }

        if (shouldUseMangaCache(force)) {
            pending.value = false;
            afterNav();
            return;
        }

        pending.value = true;
        const mid = fullChapter.value.entity.mangaId;
        const [m, v] = await Promise.all([
            api.promise.manga.fetch(mid),
            api.promise.manga.chapters(mid, ChapterOrderBy.Ordinal, true)
        ]);

        if (!api.isSuccess(m) || !api.isSuccess(v)) {
            const err = [api.errorMessage(m), api.errorMessage(v)].filter(t => !!t).join('; ');
            error.value = 'Failed to load chapter! ' + (err || 'Unknown error!');
            pending.value = false;
            afterNav();
            return;
        }

        manga.value = api.data(m);
        volumes.value = api.data(v);
        afterNav();
        pending.value = false;
    }

    /**
     * What to do after navigating to a new page
     */
    function afterNav() {
        tap();
        cleanup();
        preloadChapters();
        updateProgress();
    }

    /** Cleans up any chapters not related to the current manga */
    function cleanup() {
        if (!manga.value) return;

        for(const key in fullChapters.value) {
            if (fullChapters.value[key]?.entity.mangaId === manga.value.entity.id) continue;

            delete fullChapters.value[key];
        }
    }

    /**
     * Finds the best chapter by matching the uploader
     * @param current The current chapter to match against
     * @param chapters The options to choose from
     * @returns The best chapter or undefined if no match is found
     */
    function findBestChapter(current: string | MbChapter | MbTypeChapter, chapters: (string | MbChapter | MbTypeChapter)[]) {
        const toType = (c: string | MbChapter | MbTypeChapter): MbChapter | undefined => {
            if (typeof c !== 'string' && 'entity' in c) return c.entity;
            if (typeof c !== 'string') return c;
            return volumes.value?.chapters[c]?.chapter;
        }

        const cur = toType(current);
        if (!cur) return undefined;

        const chaps = chapters.map(toType).filter((c): c is MbChapter => !!c);
        if (chaps.length === 0) return undefined;
        if (chaps.length === 1) return chaps[0];

        const KEYS = ['group', 'scanlation group', 'uploader'];

        const attr = cur.attributes.find(a => KEYS.includes(a.name.toLowerCase()));
        if (!attr) return chaps[0];

        for(const chap of chaps) {
            const cattr = chap.attributes.find(a => a.name.toLowerCase() === attr.name.toLowerCase());
            if (cattr?.value === attr.value) return chap;
        }

        return chaps[0];
    }

    /** Preloads data from the chapters adjacent to the current chapter */
    async function preloadChapters() {
        if (!fullChapter.value || !volumes.value) return;

        const flat = flatChapters.value;
        const currentIndex = flat.findIndex(c => c.versions.includes(fullChapter.value!.entity.id));
        if (currentIndex === -1) return;

        const start = Math.max(0, currentIndex - PRE_LOAD_CHAPTERS);
        const end = Math.min(flat.length, currentIndex + PRE_LOAD_CHAPTERS + 1);
        const preloads = flat.slice(start, end)
            .map(t => findBestChapter(fullChapter.value!, t.versions)!)
            .filter(t => !!t && !fullChapters.value[t.id]);
        if (preloads.length === 0) return;

        const fetches = await Promise.all(preloads.map(c => api.promise.chapter.fetch(c.id)));
        for(const res of fetches) {
            if (!api.isSuccess(res)) continue;

            const data = api.data(res);
            if (!data) continue;

            fullChapters.value[data.entity.id] = data;
        }
    }

    /**
     * Determines the next chapter/volume/page and navigates to it
     * @param type The type of ordinal to navigate by (page, chapter, or volume)
     */
    function goNext(type: OrdinalType = 'page') {
        const nextVolume = () => {
            if (!currentVolume.value) return;

            const currentIndex = volumes.value!.volumes.indexOf(currentVolume.value);
            if (currentIndex === -1) return;

            if (currentIndex === volumes.value!.volumes.length - 1) return;

            const next = volumes.value!.volumes[currentIndex + 1];
            if (!next) return;

            if (next.chapters.length === 0) return;

            const best = findBestChapter(fullChapter.value!, next.chapters[0]!.versions);
            if (!best) return;

            return `/chapter/${best.id}?page=1`;
        }

        const nextChapter = () => {
            if (!currentVolumeChapter.value) return;

            const currentIndex = currentVolume.value!.chapters.indexOf(currentVolumeChapter.value);
            if (currentIndex === -1) return;

            if (currentIndex === currentVolume.value!.chapters.length - 1) return nextVolume();

            const next = currentVolume.value!.chapters[currentIndex + 1];
            if (!next) return;

            const best = findBestChapter(fullChapter.value!, next.versions);
            if (!best) return;

            return `/chapter/${best.id}?page=1`;
        }

        const nextPage = () => {
            if (!currentPage.value) return;

            const currentIndex = pages.value.findIndex(p => p.ordinal === currentPage.value!.ordinal);
            if (currentIndex === -1) return;

            if (currentIndex === pages.value.length - 1) return nextChapter();

            const next = pages.value[currentIndex + 1];
            if (!next) return;

            return `/chapter/${fullChapter.value!.entity.id}?page=${next.ordinal}`;
        }

        const next = (type === 'page' ? nextPage() : type === 'chapter' ? nextChapter() : nextVolume())
            ?? `/manga/${manga.value?.entity.id}`;

        navigateTo(next);
    }

    /** Goes to the start of the current chapter */
    function goStart() {
        if (!fullChapter.value) return;

        navigateTo(`/chapter/${fullChapter.value.entity.id}?page=1`);
    }

    /**
     * Determines the previous chapter/volume/page and navigates to it
     * @param type The type of ordinal to navigate by (page, chapter, or volume)
     */
    function goPrev(type: OrdinalType = 'page') {
        const prevVolume = () => {
            if (!currentVolume.value) return;

            const currentIndex = volumes.value!.volumes.indexOf(currentVolume.value);
            if (currentIndex === -1) return;

            if (currentIndex === 0) return;

            const prev = volumes.value!.volumes[currentIndex - 1];
            if (!prev) return;

            if (prev.chapters.length === 0) return;

            const best = findBestChapter(fullChapter.value!, prev.chapters[prev.chapters.length - 1]!.versions);
            if (!best) return;

            return `/chapter/${best.id}?page=-1`;
        }

        const prevChapter = () => {
            if (!currentVolumeChapter.value) return;

            const currentIndex = currentVolume.value!.chapters.indexOf(currentVolumeChapter.value);
            if (currentIndex === -1) return;

            if (currentIndex === 0) return prevVolume();

            const prev = currentVolume.value!.chapters[currentIndex - 1]!;
            const best = findBestChapter(fullChapter.value!, prev.versions);
            if (!best) return;

            return `/chapter/${best.id}?page=-1`;
        }

        const prevPage = () => {
            if (!currentPage.value) return;

            const currentIndex = pages.value.findIndex(p => p.ordinal === currentPage.value!.ordinal);
            if (currentIndex === -1) return;

            if (currentIndex === 0) return prevChapter();

            const prev = pages.value[currentIndex - 1];
            if (!prev) return;

            return `/chapter/${fullChapter.value!.entity.id}?page=${prev.ordinal}`;
        }

        const prev = (type === 'page' ? prevPage() : type === 'chapter' ? prevChapter() : prevVolume())
            ?? `/manga/${manga.value?.entity.id}`;
        navigateTo(prev);
    }

    /** Updates the progress of the current chapter and manga */
    async function _updateProgress() {
        if (!canRead.value || !params.value?.id) return;

        const res = await api.promise.progress.update(params.value.id, params.value.page);
        if (!api.isSuccess(res)) return;

        mergeProg(api.data(res));
    }

    /** Force the server to refetch the chapter pages */
    async function forceReset() {
        if (!canRead.value || !params.value?.id) return;

        const res = await api.promise.chapter.fetch(params.value.id, true);
        if (!api.isSuccess(res)) {
            error.value = 'Failed to load chapter! ' + api.errorMessage(res);
            return;
        }

        fullChapters.value[params.value.id] = api.data(res);
    }

    /** Bookmarks the current page */
    async function bookmarkPage() {
        if (!canRead.value || !params.value?.id || !currentPage.value) return;

        const pages = bookmarks.value;

        const index = pages.indexOf(params.value.page);
        if (index === -1) {
            pages.push(params.value.page);
        } else {
            pages.splice(index, 1);
        }

        const res = await api.promise.chapter.bookmark(params.value.id, pages);
        if (!api.isSuccess(res)) return;

        mergeProg(api.data(res));
    }

    /**
     * Merges the progress data into the cached manga and volumes
     * @param progress The progress to merge
     */
    function mergeProg(progress: MbTypeProgress | undefined) {
        if (!progress) return;

        mergeProgress(volumes.value, progress);
        mergeProgress(mvCache.value, progress);
    }

    return {
        manga: computed(() => manga.value?.entity),
        mangaExtended: computed(() => manga.value ? getRelated(manga.value, 'MbMangaExt') : undefined),
        cover: computed(() => manga.value ? getRelateds(manga.value, 'MbImage').toSorted((a,b) => b.ordinal - a.ordinal)[0] : undefined),
        chapter: computed(() => fullChapter.value?.entity),
        pending: computed(() => pending.value),
        partialLoading: computed(() => partialLoading.value),
        error: computed(() => error.value),
        bookmarks,
        progress,
        pages,
        preloadPages,
        regions,
        fetch,
        currentPage,
        goNext,
        goPrev,
        goStart,
        forceReset,
        bookmarkPage,
        selectLinks,
        inRegions,
    }
}
