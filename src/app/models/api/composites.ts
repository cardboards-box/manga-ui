import type {
    ContentRating,
    MbChapter, MbChapterProgress,
    MbImage, MbManga,
    MbMangaExt, MbMangaProgress,
    MbMangaRelationship, MbMangaTag,
    MbPerson, MbProfile,
    MbSource, MbTag,
    RelationshipType
} from './db';

export interface MbRelated<TType = string, TData = any> {
    type: TType;
    data?: TData;
}

type RelatedChapter = MbRelated<'MbChapter', MbChapter>;
type RelatedChapterProgress = MbRelated<'MbChapterProgress', MbChapterProgress>;
type RelatedImage = MbRelated<'MbImage', MbImage>;
type RelatedManga = MbRelated<'MbManga', MbManga>;
type RelatedMangaExt = MbRelated<'MbMangaExt', MbMangaExt>;
type RelatedMangaProgress = MbRelated<'MbMangaProgress', MbMangaProgress>;
type RelatedMangaRelationship = MbRelated<'MbMangaRelationship', MbMangaRelationship>;
type RelatedMangaTag = MbRelated<'MbMangaTag', MbMangaTag>;
type RelatedPerson = MbRelated<'MbPerson', MbPerson>;
type RelatedProfile = MbRelated<'MbProfile', MbProfile>;
type RelatedSource = MbRelated<'MbSource', MbSource>;
type RelatedTag = MbRelated<'MbTag', MbTag>;
type RelatedRelatedPerson = MbRelated<'MbRelatedPerson', MbRelatedPerson>;

export type MangaBoxRelationship =
    RelatedChapter |
    RelatedChapterProgress |
    RelatedImage |
    RelatedManga |
    RelatedMangaExt |
    RelatedMangaProgress |
    RelatedMangaRelationship |
    RelatedMangaTag |
    RelatedPerson |
    RelatedProfile |
    RelatedSource |
    RelatedTag |
    RelatedRelatedPerson;

export interface MangaBoxType<T, TRelated extends MbRelated = MangaBoxRelationship> {
    entity: T;
    related: TRelated[];
}

export interface MbRelatedPerson extends MbPerson {
    type: RelationshipType;
}

export type MbTypeChapter = MangaBoxType<MbChapter, RelatedManga | RelatedSource | RelatedImage>;
export type MbTypeProgress = MangaBoxType<MbMangaProgress, RelatedChapterProgress>;
export type MbTypeImage = MangaBoxType<MbImage, RelatedChapter | RelatedManga | RelatedSource>;
export type MbTypeManga = MangaBoxType<MbManga, RelatedSource | RelatedRelatedPerson | RelatedTag | RelatedMangaExt | RelatedImage>;
export type MbTypeMangaSearch = MangaBoxType<MbManga, RelatedSource | RelatedTag | RelatedMangaExt | RelatedImage>;
export type MbTypeMangaExt = MangaBoxType<MbMangaExt, RelatedManga | RelatedChapter | RelatedMangaProgress | RelatedChapterProgress>;

export interface VolumeChapter {
    open?: boolean;
    progress: number;
    ordinal: number;
    versions: string[];
}

export enum VolumeState {
    NotStarted = 0,
    InProgress = 1,
    Completed = 2
}

export interface MangaVolume {
    ordinal?: number;
    collapse?: boolean;
    state: VolumeState;
    chapters: VolumeChapter[];
}

export interface ProgressChapter {
    chapter: MbChapter;
    progress?: MbChapterProgress;
}

export interface MangaVolumes {
    progress?: MbMangaProgress;
    chapters: {
        [chapterId: string]: ProgressChapter;
    };
    volumes: MangaVolume[];
}

export enum ComicFormat {
    Zip = 0,
    Cbz = 1
}

export interface EnumDescription<TValue = number> {
    name: string;
    description: string;
    value: TValue;
    typeName?: string;
}

export enum ChapterOrderBy {
    Ordinal = 0,
    Date = 1,
    Language = 2,
    Title = 3,
    Read = 4
}

export enum MangaOrderBy {
    LastChapterCreatedAt = 0,
    LastChapterUpdatedAt = 1,
    FirstChapterCreatedAt = 2,
    FirstChapterUpdatedAt = 3,
    MangaCreatedAt = 4,
    MangaUpdatedAt = 5,
    ChapterCount = 6,
    VolumeCount = 7,
    Views = 8,
    Favorites = 9,
    Title = 10,
    LastRead = 11,
    Random = 12,
}

export enum MangaState {
    Favorited = 0,
    Completed = 1,
    InProgress = 2,
    Bookmarked = 3
}

export interface SearchFiler<T = MangaOrderBy | ChapterOrderBy> {
    page?: number;
    size?: number;
    search?: string;
    ids?: string[];
    order?: T;
    asc?: boolean;
}

export interface MangaSearchFilter extends SearchFiler<MangaOrderBy> {
    ratings?: ContentRating[];
    tags?: string[];
    tagsEx?: string[];
    sources?: string[];
    tagsAnd?: boolean;
    tagsExAnd?: boolean;
    states?: MangaState[];
    statesInclude?: boolean;
    statesAnd?: boolean;
    chapMin?: number;
    chapMax?: number;
    mAfter?: Date | string;
    mBefore?: Date | string;
    cLastAfter?: Date | string;
    cLastBefore?: Date | string;
    cFirstAfter?: Date | string;
    cFirstBefore?: Date | string;
}

export interface Stats {
    queue: {
        timestamp: Date | string;
        manga: number;
        chapters: number;
        images: number;
    }[],
    database: {
        period: string;
        start: Date | string;
        end: Date | string;
        manga: number;
        chapters: number;
        images: number;
        sources: number;
        people: number;
    }[]
}

export const ALL_STATES = [MangaState.Bookmarked, MangaState.Completed, MangaState.InProgress, MangaState.Favorited] as const;

const isOnly = (filter: MangaSearchFilter, state: MangaState) => {
    return filter.states && filter.states.length === 1 && filter.states.includes(state);
}

export const STATE_ROLLUP = [
    {
        text: 'All',
        routes: '/search/all',
        index: 0,
        get: (filter: MangaSearchFilter) => !filter.states || filter.states.length === 0,
        set: (filter: MangaSearchFilter) => filter.states = [],
        readRequired: false,
    }, {
        text: 'Completed',
        routes: '/search/completed',
        index: 1,
        get: (filter: MangaSearchFilter) => isOnly(filter, MangaState.Completed),
        set: (filter: MangaSearchFilter) => {
            filter.states = [MangaState.Completed];
            filter.statesInclude = true;
        },
        readRequired: true,
    }, {
        text: 'Started Reading',
        routes: '/search/in-progress',
        index: 2,
        get: (filter: MangaSearchFilter) => isOnly(filter, MangaState.InProgress),
        set: (filter: MangaSearchFilter) => {
            filter.states = [MangaState.InProgress];
            filter.statesInclude = true;
        },
        readRequired: true,
    }, {
        text: 'Favourited',
        routes: '/search/favourites',
        index: 3,
        get: (filter: MangaSearchFilter) => isOnly(filter, MangaState.Favorited),
        set: (filter: MangaSearchFilter) => {
            filter.states = [MangaState.Favorited];
            filter.statesInclude = true;
        },
        readRequired: true,
    }, {
        text: 'Bookmarked',
        routes: '/search/bookmarked',
        index: 4,
        get: (filter: MangaSearchFilter) => isOnly(filter, MangaState.Bookmarked),
        set: (filter: MangaSearchFilter) => {
            filter.states = [MangaState.Bookmarked];
            filter.statesInclude = true;
        },
        readRequired: true,
    }, {
        text: 'Not Touched',
        routes: '/search/not',
        index: 5,
        get: (filter: MangaSearchFilter) => filter.statesAnd &&
            !filter.statesInclude &&
            filter.states &&
            ALL_STATES.every(state => filter.states!.includes(state)),
        set: (filter: MangaSearchFilter) => {
            filter.states = [...ALL_STATES];
            filter.statesAnd = true;
            filter.statesInclude = false;
        },
        readRequired: true,
    }, {
        text: 'Custom Filter',
        index: 6,
        routes: '/search/custom',
        get: () => true,
        set: () => {},
        readRequired: false,
    }
] as const;
