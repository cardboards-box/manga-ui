import type { MbMangaProgress } from "~/models";

type Cache = {
    [key: string]: {
        data: MbMangaProgress | undefined;
        updated: number;
    }
}

const CACHE_EXPIRATION = 1000 * 60 * 5; // 5 minutes

export function useProgressCacheHelper() {
    const api = useMangaApi();
    const { canRead } = useAuthHelper();

    const isClient = import.meta.client;
    const tapped = useState('progress-cache-tapped', () => false);
    const cache = useState<Cache>('progress-cache', () => ({}));
    const trigger = useState('progress-cache-trigger', () => true);

    const load = (ids: string[]) => {
        for(const id of ids) {
            if (cache.value[id]) continue;

            cache.value[id] = {
                data: undefined,
                updated: 0
            };
        }

        tap();
    }

    const get = (mangaId: string) => {
        if (!cache.value[mangaId]) {
            cache.value[mangaId] = {
                data: undefined,
                updated: 0
            };
            tap();
        }

        return computed(() => cache.value[mangaId]?.data);
    }

    const expired = (value: number) => {
        if (value <= 0) return true;

        return Date.now() - value > CACHE_EXPIRATION;
    }

    const tap = async () => {
        if (!isClient || !canRead.value) return;

        const missing = [];

        for(const mid in cache.value) {
            if (cache.value[mid]!.data &&
                !expired(cache.value[mid]!.updated))
                continue;

            missing.push(mid);
            cache.value[mid]!.data = undefined;
        }

        if (missing.length === 0) return;

        const fetched = await api.promise.progress.get(missing);
        if (!api.isSuccess(fetched)) return;

        const progs = api.data(fetched) ?? [];
        for(const prog of progs) {
            if (!cache.value[prog.mangaId])
                cache.value[prog.mangaId] = {
                    data: undefined,
                    updated: 0
                };

            cache.value[prog.mangaId]!.data = prog;
            cache.value[prog.mangaId]!.updated = Date.now();
        }

        trigger.value = !trigger.value;
    }

    const clear = (...mids: string[]) =>  {
        for(const mid of mids) {
            delete cache.value[mid];
        }
    }

    (() => {
        if (!isClient || tapped.value) return;

        tapped.value = true;
        tap();
        watch(canRead, () => tap());
    })();


    return {
        load,
        get,
        clear,
        cache: computed(() => {
            trigger.value;
            const output: Record<string, MbMangaProgress> = {};
            for (const key in cache.value) {
                if (!cache.value[key]?.data) continue;
                output[key] = cache.value[key]!.data!;
            }
            return output;
        })
    }
}
