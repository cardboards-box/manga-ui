import type { Boxed, BoxedArray, BoxedPaged } from './base';
import type { MbMangaExt, MbProfile, MbTag, MbSource, MbMangaProgress } from './db';
import type {
    MbTypeChapter, MbTypeImage,
    MbTypeMangaSearch, MbTypeProgress,
    MbTypeManga,
    MangaVolumes,
    EnumDescription, Stats,
} from './composites';

export interface RespAuthResolve extends Boxed<{
    profile: MbProfile;
    token: string;
}> { }

export interface RespAuthMe extends Boxed<MbProfile> { }

export interface RespChapter extends Boxed<MbTypeChapter> { }

export interface RespProgress extends Boxed<MbTypeProgress> { }

export interface RespProgresses extends BoxedArray<MbMangaProgress> { }

export interface RespImage extends Boxed<MbTypeImage> { }

export interface RespMangaSearch extends BoxedPaged<MbTypeMangaSearch> { }

export interface RespManga extends Boxed<MbTypeManga> { }

export interface RespMangaChapters extends Boxed<MangaVolumes> { }

export interface RespMangaRecompute extends BoxedArray<MbMangaExt> { }

export interface RespMangaSet extends Boxed<MbMangaExt> { }

export interface ReqMangaLoad {
    url: string;
    force?: boolean;
}

export interface ReqMangaSetDisplay {
    mangaId: string;
    title?: string;
}

export interface RespMetadataEnums<T = number> extends BoxedArray<EnumDescription<T>> { }

export interface RespMetadataTags extends BoxedArray<MbTag> { }

export interface RespMetadataSource extends BoxedArray<MbSource> { }

export interface RespStats extends BoxedArray<Stats> { }
