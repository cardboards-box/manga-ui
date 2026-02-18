import type { FetchApiHandle } from "./fetch-api-helper";
import type { AsyncData } from "#app";
import type { FetchError } from 'ofetch';

import type {
    ApiResult, BoxedEmpty, BoxedBase, BoxedError,

    RespAuthResolve, RespAuthMe,
    RespChapter, RespProgress,
    RespProgresses, RespImage,
    RespMangaSearch, RespManga,
    RespMangaChapters, RespMangaRecompute,
    RespMangaSet, RespMetadataEnums,
    RespMetadataTags, RespMetadataSource,
    RespReverseResult, MangaSearchFilter,
    RespMangaRecommendations,

    ComicFormat, ContentRating,
    RelationshipType, ChapterOrderBy,
    VolumeState, MangaOrderBy,
    MangaState, RespStats
} from '../models';

type NuxtApiHandle = ReturnType<typeof useApiHelper>;
type Handles = FetchApiHandle | NuxtApiHandle;

type ApiReturnResults<M, T extends BoxedBase> =
    M extends FetchApiHandle ? Promise<ApiResult<T>> :
    M extends NuxtApiHandle ? AsyncData<ApiResult<T> | undefined, FetchError<BoxedError> | undefined> :
    never;

export function useSharedApi<Handle extends Handles>(api: Handle) {
    const { wrapUrl, apiUrl } = useSettingsHelper();

    const { get: fnGet, post: fnPost, del: fnDel, put: fnPut, postFile: fnPostFile } = api;
    type ResultType<T extends BoxedBase> = ApiReturnResults<Handle, T>;
    type GetFunction = <T extends BoxedBase>(url: string, param?: Params) => ResultType<T>;
    type DataFunction = <T extends BoxedBase>(url: string, body?: any, param?: Params) => ResultType<T>;

    const get: GetFunction = <any>fnGet,
        post: DataFunction = <any>fnPost,
        put: DataFunction = <any>fnPut,
        del: DataFunction = <any>fnDel,
        postFile: DataFunction = <any>fnPostFile;

    return {
        auth: {
            resolve: (code: string) => get<RespAuthResolve>(`auth/resolve`, { code }),
            me: () => get<RespAuthMe>('auth/me'),
            settings: (settings?: string) => put<RespAuthMe>('auth/settings', { settings }),
            loginUrl: (redirect?: string) => wrapUrl(apiUrl, 'auth/login/discord', {
                redirect: redirect || `${window.location.protocol}//${window.location.host}/auth`
            })
        },
        chapter: {
            fetch: (id: string, refetch?: boolean) => get<RespChapter>(`chapter/${id}`, { refetch }),
            delete: (id: string) => del<BoxedEmpty>(`chapter/${id}`),
            download: (id: string, format: ComicFormat) => wrapUrl(apiUrl, `chapter/${id}/download`, { format }),
            bookmark: (id: string, pages: number[]) => put<RespProgress>('chapter/bookmarks', { chapterId: id, bookmarks: pages })
        },
        image: {
            fetch: (id: string) => get<RespImage>(`image/${id}/meta`),
            downloadUrl: (id: string) => `/api/image/${id}`,
            stripUrl: (ids: string[]) => {
                const pars: Record<string, string> = {};
                for(let i = 0; i < ids.length; i++) {
                    pars[`ids[${i}]`] = ids[i]!;
                }
                return wrapUrl(apiUrl, `image/strip`, pars);
            }
        },
        manga: {
            search: (filter: MangaSearchFilter) => post<RespMangaSearch>('manga', filter),
            searchUrl: (filter: MangaSearchFilter) => get<RespMangaSearch>('manga', filter),
            fetch: (id: string) => get<RespManga>(`manga/${id}`),
            recommendations: (id: string, size?: number, tags?: string[]) => get<RespMangaRecommendations>(`manga/${id}/recommended`, { size, excludeTags: tags }),
            personalRecs: (size?: number, tags?: string[]) => get<RespMangaRecommendations>(`manga/recommended`, { size, excludeTags: tags }),
            delete: (id: string) => del<BoxedEmpty>(`manga/${id}`),
            chapters: (id: string, order?: ChapterOrderBy, asc?: boolean) => get<RespMangaChapters>(`manga/${id}/chapters`, { order, asc }),
            refresh: (id: string) => get<RespManga>(`manga/${id}/refresh`),
            load: (url: string, force?: boolean) => post<RespManga>('manga/load', { url, force }),
            favorite: (id: string) => get<RespProgress>(`manga/${id}/favorite`),
            unfavorite: (id: string) => del<RespProgress>(`manga/${id}/favorite`),
            recompute: (ids?: string[], since?: number) => get<RespMangaRecompute>(`manga/recompute`, { ids, since }),
            displayTitle: (id: string, title?: string) => put<RespMangaSet>('manga/display-title', { mangaId: id, display: title })
        },
        metaData: {
            contentRating: () => get<RespMetadataEnums<ContentRating>>('metadata/content-rating'),
            relationshipType: () => get<RespMetadataEnums<RelationshipType>>('metadata/relationship-type'),
            chapterOrderBy: () => get<RespMetadataEnums<ChapterOrderBy>>('metadata/chapter-order-by'),
            volumeState: () => get<RespMetadataEnums<VolumeState>>('metadata/volume-state'),
            mangaOrderBy: () => get<RespMetadataEnums<MangaOrderBy>>('metadata/manga-order-by'),
            mangaState: () => get<RespMetadataEnums<MangaState>>('metadata/manga-state'),
            downloadFormat: () => get<RespMetadataEnums<ComicFormat>>('metadata/download-format'),
            tags: () => get<RespMetadataTags>('metadata/manga-tag'),
            sources: () => get<RespMetadataSource>('metadata/sources'),
            stats: () => get<RespStats>(`metadata/stats`)
        },
        progress: {
            reset: (id: string) => del<RespProgress>(`progress/${id}/read`),
            read: (id: string) => get<RespProgress>(`progress/${id}/read`),
            fetch: (id: string) => get<RespProgress>(`progress/${id}`),
            get: (ids: string[]) => get<RespProgresses>(`progress`, { ids }),
            update: (id: string, ordinal?: number) => put<RespProgress>(`progress`, { chapterId: id, pageOrdinal: ordinal })
        },
        reverse: {
            url: (url: string) => get<RespReverseResult>('reverse-search', { url }),
            file: (file: File) => postFile<RespReverseResult>('reverse-search', file)
        }
    }
}
