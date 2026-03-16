import { ListOrderBy } from '~/models';
import type { LocationQueryValue } from 'vue-router';
import type { MbList, ListSearchFilter, ListType, MangaSearchFilter, MbTypeManga, MbTypeMangaSearch, MbManga } from '~/models';

type QueryParam = LocationQueryValue | LocationQueryValue[];

const DEFAULT_FILTERS : ListSearchFilter = {
    page: 1,
    size: 20,
    search: '',
    order: ListOrderBy.Name,
    asc: true,
    types: [],
    ids: [],
} as const;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useListHelper() {
    const api = useMangaApi();
    const { canRead } = useAuthHelper();
    const { throttle } = useUtils();
    const { addParams } = useSettingsHelper();
    const { clear } = useProgressCacheHelper();
    const route = useRoute();
    const router = useRouter();

    const listCache = useState<MbList[] | undefined>('list-cache', () => undefined);
    const listCacheTime = useState<number | undefined>('list-cache-time', () => undefined);

    function lists() {
        return useAsyncData(
            `all-lists`, async () => {
                if (!canRead.value) return [];

                const now = Date.now();
                if (listCache.value &&
                    listCacheTime.value &&
                    (now - listCacheTime.value < CACHE_DURATION))
                    return listCache.value;

                const res = await api.promise.list.all();
                if (!api.isSuccess(res)) return [];

                listCacheTime.value = now;
                return listCache.value = api.data(res);
            }, { watch: [() => canRead.value] }
        )
    }

    function search(...types: ListType[]) {
        const filters = computed(() => parseFilters(...types));
        const { pending, error, data, refresh } = useAsyncData(
            `list-search-${route.fullPath}`, async () => {
                const filters = parseFilters(...types);
                return await api.promise.list.search(filters);
            }, { watch: [() => route.query, () => canRead.value ] }
        );
        const lists = computed(() => data.value && api.data(data.value));

        return {
            refresh: throttle<void>(() => {
                listCache.value = undefined;
                if (!pending.value)
                    refresh();
            }, 250),
            pending,
            error: computed(() => error.value?.toString()),
            data: computed(() => lists.value?.data ?? []),
            total: computed(() => lists.value?.total ?? 0),
            pages: computed(() => lists.value?.pages ?? 0),
            page: computed({
                get: () => filters.value.page ?? 1,
                set: (value) => updateRoute(filters.value, { page: value })
            }),
            size: computed({
                get: () => filters.value.size ?? 20,
                set: (value) => updateRoute(filters.value, { size: value })
            }),
            filters,
        }
    }

    function parseFilters(...types: ListType[]): ListSearchFilter {
        const getArray = <T = string>(value: QueryParam, func?: (v: string) => T): T[] => {
            const values =  Array.isArray(value)
                ? value.map(v => v?.toString()?.toLowerCase()!).filter(t => !!t)
                : value ? [value.toString().toLowerCase()!] : [];

            if (func) return values.map(func);
            return <any>values;
        }

        const filter = {...DEFAULT_FILTERS};

        const pars: {
            [key: string]: {
                prop: keyof ListSearchFilter,
                massage?: (value: QueryParam) => any
            }
        } = {
            'page': { prop: 'page', massage: (v) => +(v ?? 1) },
            'size': { prop: 'size', massage: (v) => +(v ?? 20) },
            'search': { prop: 'search' },
            'order': { prop: 'order', massage: (v) => +(v ?? DEFAULT_FILTERS.order!) },
            'asc': { prop: 'asc', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
            'types': { prop: 'types', massage: (v) => getArray(v) },
            'ids': { prop: 'ids', massage: (v) => getArray(v) }
        }

        for(const key in route.query) {
            const param = pars[key.toLowerCase()];
            if (!param) continue;
            const value = route.query[key];
            if (!value) continue;
            filter[param.prop] = param.massage ? param.massage(value) : route.query[key];
        }

        filter.types = types;
        return filter;
    }

    function updateRoute(full: ListSearchFilter, merge?: Partial<ListSearchFilter>) {
        const fill = { ...full, ...merge };
        const uri = route.path;
        const url = addParams(uri, fill);
        router.push(url);
    }

    function clearFilters() {
        updateRoute({ ...DEFAULT_FILTERS });
    }

    function fetch(id: Ref<string>) {
        const refreshTrigger = ref(false);
        const filter = computed<MangaSearchFilter>(() => ({ lists: [id.value] }));
        const _pending = ref(false);
        const { data, error, pending, refresh } = useAsyncData(
            () => `list-${id.value}`, async () => {
                const list = await api.promise.list.fetch(id.value);
                if (!api.isSuccess(list))
                    throw new Error(api.errorMessage(list) ?? 'Failed to fetch list');
                return api.data(list);
            }, { watch: [() => id.value, () => canRead.value] }
        );
        const loading = computed(() => _pending.value || pending.value);

        const remove = async (manga: MbTypeManga | MbTypeMangaSearch | string) => {
            if (typeof manga !== 'string') manga = manga.entity.id;
            _pending.value = true;

            await api.promise.list.remove(id.value, manga);
            await refresh();
            clear(manga);
            _pending.value = false;
        }

        return {
            refreshTrigger,
            refresh,
            list: data,
            pending: loading,
            error: computed(() => error.value?.message),
            remove,
            filter
        }
    }

    async function add(listId: string, manga: MbManga | MbTypeManga | MbTypeMangaSearch | string) {
        const mangaId = (() => {
            if (typeof manga === 'string') return manga;
            if ('entity' in manga) return manga.entity.id;
            return (manga as MbManga).id;
        })();
        const result = await api.promise.list.add(listId, mangaId);
        if (!api.isSuccess(result)) {
            throw new Error(api.errorMessage(result) ?? 'Failed to add manga to list');
        }
        clear(mangaId);
        return api.data(result);
    }

    async function remove(listId: string, manga: MbManga | MbTypeManga | MbTypeMangaSearch | string) {
        const mangaId = (() => {
            if (typeof manga === 'string') return manga;
            if ('entity' in manga) return manga.entity.id;
            return (manga as MbManga).id;
        })();
        const result = await api.promise.list.remove(listId, mangaId);
        if (!api.isSuccess(result)) {
            throw new Error(api.errorMessage(result) ?? 'Failed to remove manga from list');
        }
        clear(mangaId);
        return api.data(result);
    }

    return {
        add,
        lists,
        fetch,
        search,
        remove,
        updateRoute,
        parseFilters,
        clearFilters,
    }
}
