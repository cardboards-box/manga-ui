import type { MbImage } from "~/models";

type ImageMetadata = {
    width: number;
    height: number;
    size: number;
    cover: boolean;
    stored: number;
};

type DatabaseMetadata = {
    totalCount: number;
    coverCount: number;
    storedSize: number;
    minDate: number;
    maxDate: number;
}

export type ImageResponse = {
    image?: {
        blob: Blob;
    } & ImageMetadata;
    code: number;
    message: string;
    reason?: string;
    cached?: boolean;
}

export type PageImage = {
    image: MbImage;
    response?: ImageResponse;
    state: 'initial' | 'loading' | 'loaded' | 'error';
}

export const useImageCache = () => {
    const { $db } = useNuxtApp();
    const api = useMangaApi();

    /** The default metadata for the image cache */
    const DEFAULT_META_DATA: DatabaseMetadata = {
        totalCount: 0,
        coverCount: 0,
        storedSize: 0,
        minDate:  Date.now(),
        maxDate: Date.now()
    } as const;

    /** The current metadata for the image cache */
    const currentMetaData = useState<DatabaseMetadata>('image-cache-metadata', () => {
        if (import.meta.client) {
            readMetadata();
        }
        return { ...DEFAULT_META_DATA };
    });

    /**
     * Creates the cache keys for the given url
     * @param url The url of the image
     * @returns The cache keys for the image
     */
    function createKeys(url: string) {
        return {
            image: `ic:image:${url}`,
            meta: `ic:meta:${url}`
        }
    }

    /**
     * Caches an image in localForage
     * @param url The URL of the image
     * @param resp The response containing the image blob and metadata
     * @returns The response of the request
     */
    async function cacheImage(url: string, resp: ImageResponse): Promise<ImageResponse> {
        if (!resp.image) return { ...resp, cached: false };

        try {
            const { image, meta } = createKeys(url);
            await $db.setItem(image, resp.image.blob);
            await $db.setItem(meta, { 
                width: resp.image.width, 
                height: resp.image.height, 
                size: resp.image.size, 
                cover: resp.image.cover,
                stored: resp.image.stored
            });
            currentMetaData.value.totalCount++;
            if (resp.image.cover) currentMetaData.value.coverCount++;
            currentMetaData.value.storedSize += resp.image.size;
            if (resp.image.stored < currentMetaData.value.minDate) 
                currentMetaData.value.minDate = resp.image.stored;
            if (resp.image.stored > currentMetaData.value.maxDate) 
                currentMetaData.value.maxDate = resp.image.stored;
            return { ...resp, cached: true };
        } catch (error) {
            console.error('Failed to cache image', {
                url,
                resp,
                error
            });
            return {
                ...resp,
                code: 500,
                message: 'Failed to cache image',
                reason: error instanceof Error ? error.message : error?.toString(),
                cached: false
            }
        }
    }

    /**
     * Fetches an image from the given URL and then caches it
     * @param url The URL of the image to fetch
     * @param signal The abort signal to cancel the fetch request
     * @returns The response containing the image blob and metadata
     */
    async function fetchRawImage(url: string, cover: boolean, signal: AbortController): Promise<ImageResponse> {
        try {
            const response = await fetch(url, { signal: signal.signal });
            if (!response.ok) {
                return {
                    image: undefined,
                    code: response.status,
                    message: 'Failed to fetch image',
                    reason: response.statusText
                }
            }
            const blob = await response.blob();
            const image = await createImageBitmap(blob);
            const current: ImageResponse = { 
                image: { 
                    blob, 
                    width: image.width, 
                    height: image.height,
                    size: blob.size,
                    cover,
                    stored: Date.now()
                }, 
                code: response.status, 
                message: 'Success' 
            };
            image.close();
            if (import.meta.client)
                return await cacheImage(url, current);
            return current;
        } catch (error) {
            return {
                image: undefined,
                code: 500,
                message: 'Failed to fetch image',
                reason: error instanceof Error ? error.message : error?.toString()
            }
        }
    }

    /**
     * Fetches an image from the cache
     * @param url The URL of the image
     * @returns The cached image data
     */
    async function fetchCached(url: string): Promise<ImageResponse | undefined> { 
        try {
            if (!import.meta.client) return undefined;

            const { image, meta } = createKeys(url);
            const [blob, metadata] = await Promise.all([
                $db.getItem<Blob>(image),
                $db.getItem<ImageMetadata>(meta)
            ]);

            if (!blob || !metadata) return undefined;

            return {
                image: {
                    blob,
                    ...metadata
                },
                code: 200,
                message: 'Image retrieved from cache',
                cached: true
            }
        } catch (error) {
            console.error('Failed to fetch image from cache', {
                url,
                error
            });
            return undefined;
        }
    }

    /**
     * Fetches an image with cache support
     * @param image The image to fetch
     * @param ctrl The optional abort controller
     * @returns The response containing the image blob and metadata
     */
    async function get(image: string | MbImage, ctrl?: AbortController): Promise<ImageResponse> {
        ctrl ??= new AbortController();
        const url = typeof image === 'string' ? image : api.promise.image.downloadUrl(image);
        const cover = typeof image !== 'string' && !image.chapterId;
        
        const cached = await fetchCached(url);
        if (cached) return cached;

        return await fetchRawImage(url, cover, ctrl);
    }

    /**
     * Reads the current metadata from the database and updates the state
     * @returns The current metadata
     */
    async function readMetadata() {
        try {
            const { meta } = createKeys('');
            const keys = await $db.keys();
            const metaKeys = keys.filter(k => k.startsWith(meta));
            const metadataList = await Promise.all(metaKeys.map(k => $db.getItem<ImageMetadata>(k)));
            const validMetadata = metadataList.filter(m => !!m) as ImageMetadata[];

            const current = { ...DEFAULT_META_DATA };

            for(const meta of validMetadata) {
                current.totalCount++;
                if (meta.cover) current.coverCount++;
                current.storedSize += meta.size;
                if (meta.stored < current.minDate) 
                    current.minDate = meta.stored;
                if (meta.stored > current.maxDate) 
                    current.maxDate = meta.stored;
            }

            currentMetaData.value = current;
            return { ...current };
        } catch (error) {
            console.error('Failed to read image cache metadata', { error });
            return { ...currentMetaData.value };
        }
    }

    /**
     * Clears the image cache
     * @param covers Whether or not to clear cover images as well
     */
    async function clearCache(covers = false) {
        try {
            if (covers) {
                await $db.clear();
                currentMetaData.value = { ...DEFAULT_META_DATA };
                return;
            }

            const { meta } = createKeys('');
            const keys = await $db.keys();
            const metaKeys = keys.filter(k => k.startsWith(meta));

            let clearedCount = 0;
            for (const key of metaKeys) {
                const imageUrl = key.substring(meta.length);
                const { image } = createKeys(imageUrl);
                const metadata = await $db.getItem<ImageMetadata>(key);

                if (metadata?.cover) continue;

                clearedCount++;
                await Promise.all([
                    $db.removeItem(key),
                    $db.removeItem(image)
                ]);
            }

            console.info(`Cleared ${clearedCount} images from cache`);
            await readMetadata();
        } catch (error) {
            console.error('Failed to clear image cache', { error });
        }
    }

    return {
        get,
        meta: computed(() => currentMetaData.value),
        refreshMeta: readMetadata,
        clear: clearCache
    }
}