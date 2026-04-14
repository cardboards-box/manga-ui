import type { Boxed, BoxedArray, BoxedPaged } from './base';
import type { MbMangaExt, MbProfile, MbTag, MbSource, MbList, MbApiKey } from './db';
import type {
    MbTypeChapter, MbTypeImage,
    MbTypeMangaSearch, MbTypeProgress,
    MbTypeManga, MbTypeList, MbTypeListSearch,
    MangaVolumes,
    EnumDescription, Stats,
    MbTypeProgressMulti,
} from './composites';

export interface RespAuthResolve extends Boxed<{
    profile: MbProfile;
    token: string;
}> { }

export interface RespAuthMe extends Boxed<MbProfile> { }

export interface RespChapter extends Boxed<MbTypeChapter> { }

export interface RespProgress extends Boxed<MbTypeProgress> { }

export interface RespProgresses extends BoxedArray<MbTypeProgressMulti> { }

export interface RespImage extends Boxed<MbTypeImage> { }

export interface RespMangaSearch extends BoxedPaged<MbTypeMangaSearch> { }

export interface RespMangaRecommendations extends BoxedArray<MbTypeMangaSearch> { }

export interface RespManga extends Boxed<MbTypeManga> { }

export interface RespMangaChapters extends Boxed<MangaVolumes> { }

export interface RespMangaRecompute extends BoxedArray<MbMangaExt> { }

export interface RespMangaSet extends Boxed<MbMangaExt> { }

export interface RespList extends Boxed<MbTypeList> { }

export interface RespLists extends BoxedArray<MbList> { }

export interface RespListSearch extends BoxedPaged<MbTypeListSearch> { }

export interface RespApiKeys extends BoxedArray<MbApiKey> { }

export interface RespApiKey extends Boxed<MbApiKey> { }

export interface RespApiKeyKey extends Boxed<string> { }

export interface ReqMangaLoad {
    url: string;
    force?: boolean;
}

export interface ReqMangaSetDisplay {
    mangaId: string;
    title?: string;
}

export interface ReqMangaApiKey {
    name: string;
}

export interface RespMetadataEnums<T = number> extends BoxedArray<EnumDescription<T>> { }

export interface RespMetadataTags extends BoxedArray<MbTag> { }

export interface RespMetadataSource extends BoxedArray<MbSource> { }

export interface RespStats extends Boxed<Stats> { }
