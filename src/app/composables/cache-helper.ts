import type { ApiResult, BoxedArray, BoxedError, Boxed } from "~/models";

type CacheItem<T> = {
    value?: T[];
    updated: number;
}

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export function useCacheHelper() {
    const api = useMangaApi();

    const CACHE_ITEMS = {
        'tags': () => api.promise.metaData.tags(),
        'sources': () => api.promise.metaData.sources(),
        'contentRatings': () => api.promise.metaData.contentRating(),
        'mangaOrderBy': () => api.promise.metaData.mangaOrderBy(),
        'mangaState': () => api.promise.metaData.mangaState(),
        'downloadFormat': () => api.promise.metaData.downloadFormat(),
        'chapterOrderBy': () => api.promise.metaData.chapterOrderBy(),
        'relationshipType': () => api.promise.metaData.relationshipType(),
        'volumeState': () => api.promise.metaData.volumeState()
    };

    type Keys = keyof typeof CACHE_ITEMS;

    type Result<T extends Keys> = Exclude<
        Awaited<ReturnType<typeof CACHE_ITEMS[T]>>,
        BoxedError
    >['data'][number];

    type Cache = {
        [key in Keys]?: CacheItem<Result<key>>;
    };

    type Output = {
        [key in Keys]: Result<key>[];
    }

    const cache = useState<Cache>('cache', () => ({}));
    const isValid = (time: number) => Date.now() - time < CACHE_DURATION;

    const get = async (): Promise<Output> => {
        const output: Partial<Output> = {};

        const missing: Keys[] = [];
        for (const key in CACHE_ITEMS) {
            const keyTyped = key as Keys;
            const item = cache.value[keyTyped] as CacheItem<Result<typeof keyTyped>>;
            if (!item || !isValid(item.updated)) {
                missing.push(keyTyped);
            } else {
                output[keyTyped] = <any>item.value!;
            }
        }

        if (missing.length > 0) {
            const results = await Promise.all(missing.map(key => CACHE_ITEMS[key]()));
            results.forEach((result, index) => {
                const key = missing[index]!;
                const data = (api.data(result as ApiResult<Boxed<Result<typeof key>[]>>) ?? [])

                cache.value[key] = {
                    value: <any>data,
                    updated: Date.now()
                };
                output[key] = <any>data;
            });
        }

        return output as Output;
    }

    const clear = (...keys: Keys[]) => {
        if (keys.length === 0) {
            cache.value = {};
        } else {
            keys.forEach(key => {
                delete cache.value[key];
            });
        }
    }

    return {
        get,
        clear
    }
}
