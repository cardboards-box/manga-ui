import type { BoxedArray } from "./base";
import type { MbTypeMangaSearch } from "./composites";

export interface ImageSearchResult<TSource = string, TType = any> {
    /** The image search service that found this result */
    source: TSource;
    /** The image that matched */
    image?: string;
    /** The score of the result */
    score: number;
    /** Whether or not the result is an exact match */
    exact: boolean;
    /** The closest manga result */
    closest?: MbTypeMangaSearch;
    /** The service-specific result */
    result?: TType;
}

/** A Google Vision match item */
export interface VisionItem {
    /** The score of the result */
    score: number;
    /** The URL of the result */
    url: string;
}

/** A Google Vision page result */
export interface VisionPage {
    /** Full image matches */
    fullMatches: VisionItem[];
    /** Partial image matches */
    partialMatches: VisionItem[];
    /** The URL of the page */
    url: string;
    /** The score of the result */
    score: number;
    /** The title of the page */
    title: string;
    /** The purged title of the page */
    purgeTitle: string;
}

export type RISVisionResult = ImageSearchResult<'google-vision', VisionPage>;

/** The type of manga metadata found by reverse image search */
export enum MangaMetaDataType {
    /** A page image */
    page = 0,
    /** A cover image */
    cover = 1
}

/** Manga image metadata found by reverse image search */
export interface MangaMetaData {
    /** The metadata ID */
    id: string;
    /** The image URL */
    url: string;
    /** The source name */
    source: string;
    /** The metadata type */
    type: MangaMetaDataType;
    /** The manga ID */
    mangaId: string;
    /** The chapter ID */
    chapterId?: string;
    /** The page ordinal */
    page?: number;
}

export type RISMatchResult = ImageSearchResult<'match', MangaMetaData>;

/** A SauceNAO search result */
export interface SauceNaoResult {
    /** The SauceNAO result header */
    header: {
        /** The similarity score */
        similarity: string;
        /** The result thumbnail */
        thumbnail: string;
        /** The SauceNAO index ID */
        index_id: number;
        /** The SauceNAO index name */
        index_name: string;
    };
    /** The SauceNAO result data */
    data: {
        /** External URLs for the result */
        ext_urls: string[];
        /** The result title */
        title?: string;
        /** The author name */
        author_name?: string;
        /** The author URL */
        author_url?: string;
        /** The Pixiv ID */
        pixiv_id?: string;
        /** The member name */
        member_name?: string;
        /** The member ID */
        member_id?: number;
        /** The BCY ID */
        bcy_id?: number;
        /** The member link ID */
        member_link_id?: number;
        /** The BCY type */
        bcy_type?: string;
        /** When the source item was created */
        created_at?: Date | string;
        /** The Pawoo ID */
        pawoo_id?: number;
        /** The Pawoo account */
        pawoo_user_acct?: string;
        /** The Pawoo username */
        pawoo_user_username?: string;
        /** The Pawoo display name */
        pawoo_user_display_name?: string;
        /** The AniDB anime ID */
        anidb_aid?: number;
        /** The source title */
        source?: string;
        /** The part title */
        part?: string;
        /** The release year */
        year?: string;
        /** The estimated time */
        est_time?: string;
        /** The Seiga ID */
        seiga_id?: number;
        /** The Sankaku ID */
        sankaku_id?: number;
        /** The Danbooru ID */
        danbooru_id?: number;
        /** The company name */
        company?: string;
        /** The Getchu ID */
        getchu_id?: string;
        /** The MangaDex ID */
        md_id?: string;
    }

}

export type RISSauceNaoResult = ImageSearchResult<'sauce-nao', SauceNaoResult>;

export type ImageSearchResultType = RISVisionResult | RISMatchResult | RISSauceNaoResult;

/** Searches for any matching manga */
export interface RespReverseResult extends BoxedArray<ImageSearchResultType> { }
