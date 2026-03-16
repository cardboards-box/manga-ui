import type { MbTypeProgressMulti } from "~/models";

type Cache = {
    [key: string]: {
        data: MbTypeProgressMulti | undefined;
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

    function get(id: string) : ComputedRef<MbTypeProgressMulti | undefined>;
    function get(ids: string[]): ComputedRef<(MbTypeProgressMulti)[]>;
    function get(ids: string | string[]) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        for(const mangaId of ids) {
            if (cache.value[mangaId]) continue;

            cache.value[mangaId] = {
                data: undefined,
                updated: 0
            };
        }

        tap();

        if (ids.length === 1)
            return computed(() => cache.value[ids[0]!]?.data);

        return computed(() => ids.map(id => cache.value[id]?.data).filter(t => !!t));
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
            if (!cache.value[prog.entity.mangaId])
                cache.value[prog.entity.mangaId] = {
                    data: undefined,
                    updated: 0
                };

            cache.value[prog.entity.mangaId]!.data = prog;
            cache.value[prog.entity.mangaId]!.updated = Date.now();
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
            const output: Record<string, MbTypeProgressMulti> = {};
            for (const key in cache.value) {
                if (!cache.value[key]?.data) continue;
                output[key] = cache.value[key]!.data!;
            }
            return output;
        })
    }
}
