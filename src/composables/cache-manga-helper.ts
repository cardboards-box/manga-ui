import type { Chapter, MangaVolumed, VolumeSort } from "~/models";

type Params = {
    id: string | number;
    sort: VolumeSort;
    asc: boolean;
}

const CACHE_KEY = 'manga-cache-';

export const useMangaCache = () => {
    const { volumed, pages } = useMangaApi();
    const { token } = useSettingsHelper();
    const { proxy } = useApiHelper();
    const { throttle } = useUtils();
    const route = useRoute();

    const pending = useState<boolean>(CACHE_KEY + 'loading', () => false);
    const unauthed = useState<boolean>(CACHE_KEY + 'unauthed', () => true);
    const triggered = useState<boolean>(CACHE_KEY + 'retrigger', () => false);
    const invalidate = useState<boolean>(CACHE_KEY + 'invalidate', () => false);
    const error = useState<string | undefined>(CACHE_KEY + 'error', () => undefined);
    const params = useState<Params | undefined>(CACHE_KEY + 'params', () => undefined);
    const data = useState<MangaVolumed | undefined>(CACHE_KEY + 'data', () => undefined);

    const getParamsFromRoute = (): Params => {
        return {
            id: route.params.id.toString(),
            sort: route.query.sort?.toString()?.toLocaleLowerCase() as VolumeSort ?? 'oridinal',
            asc: (route.query.asc?.toString()?.toLowerCase() ?? 'true') == 'true'
        }
    }

    const shouldUseCache = (pars: Params) => {
        if (!params.value || !data.value || unauthed.value ||
            params.value.asc !== pars.asc ||
            params.value.sort !== pars.sort) return false;

        return data.value.manga.id == pars.id || data.value.manga.hashId == pars.id;
    }

    const fetch = async (pars: Params) => {
        pending.value = true;
        params.value = pars;
        unauthed.value = !process.client || !token.value;
        const { data: d, error: e } = await volumed(pars.id, ref({ sort: pars.sort, asc: pars.asc }));
        invalidate.value = false;
        error.value = e.value?.message;
        data.value = d.value ?? undefined;
        triggered.value = !triggered.value;
        pending.value = false;
        return data.value;
    }

    const refresh = async (force: boolean = false) => {
        const pars = getParamsFromRoute();
        if (!force && !invalidate.value && shouldUseCache(pars)) return data.value;
        if (pending.value) return data.value;
        return await fetch(pars);
    }

    const getPages = async (chapter: Chapter) => {
        const doProxy = (urls: string[]) => urls.map(t => proxy(t, 'manga-page', data.value?.manga?.referer));

        if (chapter.pages && chapter.pages.length > 0) return doProxy(chapter.pages);

        const { data: d, error: e } = await pages(chapter.mangaId, chapter.id);
        if (e.value || !d.value) return [];

        chapter.pages = d.value;
        return doProxy(d.value);
    }

    const throttled = throttle<void>(() => refresh(), 200);

    return {
        data,
        error,
        params,
        pending,
        unauthed,
        triggered,
        invalidate,

        refresh,
        getPages,
        throttled,
    }
};
