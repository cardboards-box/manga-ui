import type { BoxedArray } from "./base";
import type { MbTypeMangaSearch } from "./composites";

export interface ImageSearchResult<TSource = string, TType = any> {
    source: TSource;
    image?: string;
    score: number;
    exact: boolean;
    closest?: MbTypeMangaSearch;
    result?: TType;
}

export interface VisionItem {
    score: number;
    url: string;
}

export interface VisionPage {
    fullMatches: VisionItem[];
    partialMatches: VisionItem[];
    url: string;
    score: number;
    title: string;
    purgeTitle: string;
}

export type RISVisionResult = ImageSearchResult<'google-vision', VisionPage>;

export enum MangaMetaDataType {
    page = 0,
    cover = 1
}

export interface MangaMetaData {
    id: string;
    url: string;
    source: string;
    type: MangaMetaDataType;
    mangaId: string;
    chapterId?: string;
    page?: number;
}

export type RISMatchResult = ImageSearchResult<'match', MangaMetaData>;

export interface SauceNaoResult {
    header: {
        similarity: string;
        thumbnail: string;
        index_id: number;
        index_name: string;
    };
    data: {
        ext_urls: string[];
        title?: string;
        author_name?: string;
        author_url?: string;
        pixiv_id?: string;
        member_name?: string;
        member_id?: number;
        bcy_id?: number;
        member_link_id?: number;
        bcy_type?: string;
        created_at?: Date | string;
        pawoo_id?: number;
        pawoo_user_acct?: string;
        pawoo_user_username?: string;
        pawoo_user_display_name?: string;
        anidb_aid?: number;
        source?: string;
        part?: string;
        year?: string;
        est_time?: string;
        seiga_id?: number;
        sankaku_id?: number;
        danbooru_id?: number;
        company?: string;
        getchu_id?: string;
        md_id?: string;
    }

}

export type RISSauceNaoResult = ImageSearchResult<'sauce-nao', SauceNaoResult>;

export type ImageSearchResultType = RISVisionResult | RISMatchResult | RISSauceNaoResult;

export interface RespReverseResult extends BoxedArray<ImageSearchResultType> { }
