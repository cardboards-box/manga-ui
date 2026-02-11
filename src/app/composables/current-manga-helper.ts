import { ChapterOrderBy } from '~/models';
import type { MangaVolumes, MbTypeManga, MbTypeChapter, MbChapter, MbTypeProgress, ApiResult, RespManga, RespMangaChapters } from '~/models';

const CACHE_KEY = 'manga-cache-';

type Params = {
    id: string;
    sort: ChapterOrderBy,
    asc: boolean;
}

export function useCurrentManga() {
    const api = useMangaApi();
    const { throttle } = useUtils();
    const route = useRoute();
    const { canRead } = useAuthHelper();
    const { getRelated, getRelateds, mergeProgress, calculateProgress } = useMangaUtils();

    const pending = useState<boolean>(CACHE_KEY + 'loading', () => false);
    const unauthed = useState<boolean>(CACHE_KEY + 'unauthed', () => true);
    const triggered = useState<boolean>(CACHE_KEY + 'triggered', () => false);
    const invalidate = useState<boolean>(CACHE_KEY + 'invalidate', () => false);
    const partialLoading = useState<boolean>(CACHE_KEY + 'partial-loading', () => false);
    const error = useState<string | undefined>(CACHE_KEY + 'error', () => undefined);
    const params = useState<Params | undefined>(CACHE_KEY + 'params', () => undefined);
    const manga = useState<MbTypeManga | undefined>(CACHE_KEY + 'manga', () => undefined);
    const volumes = useState<MangaVolumes | undefined>(CACHE_KEY + 'volumes', () => undefined);
    const chapters = useState<Record<string, MbTypeChapter>>(CACHE_KEY + 'chapters', () => ({}));

    const extended = computed(() => manga.value ? getRelated(manga.value, 'MbMangaExt') : undefined);

    const getRouteParams = (): Params => {
        return {
            id: route.params.id!.toString(),
            sort: +(route.query.sort?.toString() ?? '0') as ChapterOrderBy,
            asc: (route.query.asc?.toString()?.toLowerCase() ?? 'true') == 'true'
        }
    }

    const shouldUseCache = (pars: Params) => {
        if (!params.value || !manga.value ||
            !volumes.value?.progress || unauthed.value ||
            params.value.asc !== pars.asc ||
            params.value.sort !== pars.sort)
            return false;

        return manga.value.entity.id === pars.id;
    }

    const fetch = async (pars: Params, force: boolean = false) => {
        const doFetch = async (force: boolean)
            : Promise<[ApiResult<RespManga>, ApiResult<RespMangaChapters>]> => {
            if (!force) return await Promise.all([
                api.promise.manga.fetch(pars.id),
                api.promise.manga.chapters(pars.id, pars.sort, pars.asc)
            ]);

            const manga = await api.promise.manga.refresh(pars.id);
            const volumes = await api.promise.manga.chapters(pars.id, pars.sort, pars.asc);
            return [manga, volumes];
        };

        pending.value = true;
        if (pars.id !== manga.value?.entity.id) {
            chapters.value = {};
        }

        params.value = pars;
        unauthed.value = !import.meta.client || !canRead.value;
        const [mres, vres] = await doFetch(force);

        invalidate.value = false;
        if (!mres || !vres || !api.isSuccess(mres) || !api.isSuccess(vres)) {
            error.value = [api.errorMessage(mres), api.errorMessage(vres)]
                .filter(t => !!t).join('; ') || 'An error occurred while loading manga!';
        }

        manga.value = api.data(mres);
        volumes.value = api.data(vres);
        triggered.value = !triggered.value;
        pending.value = false;
        return manga.value;
    }

    const refresh = (force: boolean = false, reset: boolean = false) => {
        const pars = getRouteParams();
        if (!force && !invalidate.value && shouldUseCache(pars)) return manga.value;
        if (pending.value) return manga.value;
        return fetch(pars, reset);
    }

    const getChapter = async (id: string) => {
        if (chapters.value[id]) return chapters.value[id];

        const res = await api.promise.chapter.fetch(id);
        if (!api.isSuccess(res)) {
            error.value = api.errorMessage(res) || 'An error occurred while loading chapter!';
            return undefined;
        }

        chapters.value[id] = api.data(res);
        return chapters.value[id];
    }

    const throttled = throttle<boolean>((force) => refresh(force), 200);

    const favourited = computed({
        get: () => volumes.value?.progress?.favorited ?? false,
        set: async (value: boolean) => {
            if (!canRead.value || !params.value?.id) return;

            partialLoading.value = true;
            const res = await (value
                ? api.promise.manga.favorite(params.value.id)
                : api.promise.manga.unfavorite(params.value.id));
            partialLoading.value = false;
            if (!api.isSuccess(res)) return;

            mergeProgress(volumes.value, api.data(res));
        }
    });

    const resetProgress = async () => {
        if (!canRead.value || !params.value?.id) return;

        partialLoading.value = true;
        const res = await api.promise.progress.reset(params.value.id);
        partialLoading.value = false;
        if (!api.isSuccess(res)) return;

        mergeProgress(volumes.value, api.data(res));
    }

    const markAsRead = async () => {
        if (!canRead.value || !params.value?.id) return;

        partialLoading.value = true;
        const res = await api.promise.progress.read(params.value.id);
        partialLoading.value = false;
        if (!api.isSuccess(res)) return;

        mergeProgress(volumes.value, api.data(res));
    }

    const forceRefresh = () => refresh(true, true);

    return {
        fullManga: computed(() => manga.value),
        manga: computed(() => manga.value?.entity),
        extended,
        source: computed(() => manga.value ? getRelated(manga.value, 'MbSource') : undefined),
        tags: computed(() => manga.value ? getRelateds(manga.value, 'MbTag') : []),
        cover: computed(() => manga.value ? getRelated(manga.value, 'MbImage') : undefined),
        people: computed(() => manga.value ? getRelateds(manga.value, 'MbRelatedPerson') : []),
        volumes: computed(() => volumes.value),
        chapters: computed(() => Object.entries(volumes.value?.chapters ?? {}).map(([_, chapter]) => chapter)),
        bookmarks: computed(() => Object.entries(volumes.value?.chapters ?? {})
            .map(([_, chapter]) => chapter)
            .filter(progress => progress && progress.progress && progress.progress.bookmarks.length > 0)),
        progress: computed(() => volumes.value?.progress),
        error: computed(() => error.value),
        params: computed(() => params.value),
        pending: computed(() => pending.value),
        unauthed: computed(() => unauthed.value),
        triggered: computed(() => triggered.value),
        invalidate: computed(() => invalidate.value),
        partialLoading: computed(() => partialLoading.value),
        progressData: computed(() => calculateProgress(volumes.value, extended.value, 0)),
        forceRefresh,
        favourited,
        resetProgress,
        markAsRead,
        getChapter,
        throttled,
        refresh,
    }
}
