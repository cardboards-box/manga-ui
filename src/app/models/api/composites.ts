import type {
    ContentRating,
    MbChapter, MbChapterProgress,
    MbImage, MbManga,
    MbMangaExt, MbMangaProgress,
    MbMangaRelationship, MbMangaTag,
    MbPerson, MbProfile,
    MbSource, MbTag,
    MbList, MbListItem, MbListExt,
    RelationshipType, MbWork,
    MbTagExt, MbLogLevel
} from './db';

export interface MbRelated<TType = string, TData = any> {
    /** The name of the type of the relationship */
    type: TType;
    /** The relationship entity */
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
type RelatedList = MbRelated<'MbList', MbList>;
type RelatedListItem = MbRelated<'MbListItem', MbListItem>;
type RelatedListExt = MbRelated<'MbListExt', MbListExt>;
type RelatedRelatedManga = MbRelated<'MbRelatedManga', MbRelatedManga>;
type RelatedWork = MbRelated<'MbWork', MbWork>;
type RelatedTagExt = MbRelated<'MbTagExt', MbTagExt>;

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
    RelatedRelatedPerson |
    RelatedList |
    RelatedListItem |
    RelatedListExt |
    RelatedRelatedManga |
    RelatedWork;

export interface MangaBoxType<T, TRelated extends MbRelated = MangaBoxRelationship> {
    /** The primary entity */
    entity: T;
    /** All of the related entities */
    related: TRelated[];
}

/** Represents a person with their manga relationship type */
export interface MbRelatedPerson extends MbPerson {
    /** The relationship type */
    type: RelationshipType;
}

export type MbTypeChapter = MangaBoxType<MbChapter, RelatedManga | RelatedSource | RelatedImage>;
export type MbTypeProgress = MangaBoxType<MbMangaProgress, RelatedChapterProgress | RelatedList>;
export type MbTypeProgressMulti = MangaBoxType<MbMangaProgress, RelatedList>;
export type MbTypeImage = MangaBoxType<MbImage, RelatedChapter | RelatedManga | RelatedSource>;
export type MbTypeManga = MangaBoxType<MbManga, RelatedSource | RelatedRelatedPerson | RelatedTag | RelatedMangaExt | RelatedImage | RelatedWork | RelatedRelatedManga>;
export type MbTypeMangaSearch = MangaBoxType<MbManga, RelatedSource | RelatedTag | RelatedMangaExt | RelatedImage>;
export type MbTypeMangaExt = MangaBoxType<MbMangaExt, RelatedManga | RelatedChapter | RelatedMangaProgress | RelatedChapterProgress>;
export type MbTypeList = MangaBoxType<MbList, RelatedListItem | RelatedTag | RelatedImage | RelatedListExt>;
export type MbTypeListSearch = MangaBoxType<MbList, RelatedTag | RelatedImage | RelatedListExt>;
export type MbTypeTag = MangaBoxType<MbTag, RelatedTagExt>;

export interface VolumeChapterPartials {
    /** The ordinal for the chapter */
    ordinal: number;
    /** An array of chapter version IDs */
    versions: string[];
    /** Whether or not the partial chapter group is open in the UI */
    open?: boolean;
}

/** Represents a volume within a chapter */
export interface VolumeChapter {
    /** Whether or not the chapter group is open in the UI */
    open?: boolean;
    /** The progress percentage of the chapter */
    progress: number;
    /** The ordinal of the chapter */
    ordinal: number;
    /** The various versions of the chapters */
    whole: string[];
    /** The partial versions of the chapter */
    partial: VolumeChapterPartials[];
}

/** Indicates the impact of the transition to the next chapter. */
export enum ChapterTransition {
    /** The next chapter is in the same partial set */
    Partial = 0,
    /** The next chapter in the same volume */
    Chapter = 1,
    /** The next chapter is in a different volume */
    Volume = 2,
    /** There is no next chapter in the manga */
    End = 3,
}

export interface ChapterSuggestion {
    /** The ID of the suggested chapter */
    id?: string;
    /** Indicates the impact of the transition to the next chapter. */
    transition: ChapterTransition;
}

/** Represents the state of the volume */
export enum VolumeState {
    /** The volume has not been started */
    NotStarted = 0,
    /** The volume is in progress */
    InProgress = 1,
    /** The volume is completed */
    Completed = 2
}

/** Represents a volume of manga */
export interface MangaVolume {
    /** The ordinal of the volume */
    ordinal?: number;
    /** Whether or not the volume is collapsed in the UI */
    collapse?: boolean;
    /** Represents the state of the volume */
    state: VolumeState;
    /** The chapters in the volume */
    chapters: VolumeChapter[];
}

/** Represents a chapter within a manga */
export interface ProgressChapter {
    /** The chapter */
    chapter: MbChapter;
    /** The progress for the chapter */
    progress?: MbChapterProgress;
}

/** Represents a volume of manga */
export interface MangaVolumes {
    /** The progress for the manga */
    progress?: MbMangaProgress;
    /** The chapters in the manga */
    chapters: {
        [chapterId: string]: ProgressChapter;
    };
    /** The volumes of the manga */
    volumes: MangaVolume[];
    /** The suggestions of what chapter to read next */
    suggestions: {
        [key: string]: ChapterSuggestion;
    }
}

/** The formats for comic archives. */
export enum ComicFormat {
    /** ZIP archive */
    Zip = 0,
    /** CBZ archive */
    Cbz = 1
}

/** Describes an enum value returned by the metadata endpoints */
export interface EnumDescription<TValue = number> {
    /** The enum name */
    name: string;
    /** The enum description */
    description: string;
    /** The enum value */
    value: TValue;
    /** The enum type name */
    typeName?: string;
}

/** How to order chapters when volume-ing */
export enum ChapterOrderBy {
    Ordinal = 0,
    Date = 1,
    Language = 2,
    Title = 3,
    Read = 4
}

/** The order criteria for manga searches */
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

/** The state of a manga as related to a user */
export enum MangaState {
    Favorited = 0,
    Completed = 1,
    InProgress = 2,
    Bookmarked = 3
}

/** The order criteria for list searches */
export enum ListOrderBy {
    CreatedAt = 0,
    UpdatedAt = 1,
    Name = 2,
    IsPublic = 3,
    Random = 4
}

/** The various types of lists to search for */
export enum ListType {
    Mine = 0,
    Public = 1,
}

/** The order criteria for log searches */
export enum LogOrderBy {
    CreatedAt = 0,
    Level = 1,
    Source = 2,
    Category = 3,
}

/** The order criteria for profile searches */
export enum ProfileOrderBy {
    CreatedAt = 0,
    UpdatedAt = 1,
    Username = 2,
    PlatformId = 3,
    Provider = 4,
    ProviderId = 5,
    Admin = 6,
    CanRead = 7,
}

/** The base filter for paged API searches */
export interface SearchFiler<T = MangaOrderBy | ChapterOrderBy> {
    /** The page of results to fetch */
    page?: number;
    /** The size of the results */
    size?: number;
    /** The text to search for */
    search?: string;
    /** The IDs to include */
    ids?: string[];
    /** The order criteria */
    order?: T;
    /** Ordering direction */
    asc?: boolean;
}

/** The search filter for manga */
export interface MangaSearchFilter extends SearchFiler<MangaOrderBy> {
    /** The ratings to filter by */
    ratings?: ContentRating[];
    /** Tags to include in the search */
    tags?: string[];
    /** Tags to exclude in the search */
    tagsEx?: string[];
    /** All of the sources to fetch manga from */
    sources?: string[];
    /** Whether to match all tags (AND - true) or any tag (OR - false) */
    tagsAnd?: boolean;
    /** Whether to match all exclusion tags (AND - true) or any exclusion tag (OR - false) */
    tagsExAnd?: boolean;
    /** The state of the manga in the user's library */
    states?: MangaState[];
    /** Whether or not to invert the state filter */
    statesInclude?: boolean;
    /** Whether or not to use AND for the states filter */
    statesAnd?: boolean;
    /** The minimum number of chapters the manga should have */
    chapMin?: number;
    /** The maximum number of chapters the manga should have */
    chapMax?: number;
    /** Ensure the manga was created after this date */
    mAfter?: Date | string;
    /** Ensure the manga was created before this date */
    mBefore?: Date | string;
    /** Ensure the latest chapter was created after this date */
    cLastAfter?: Date | string;
    /** Ensure the latest chapter was created before this date */
    cLastBefore?: Date | string;
    /** Ensure the first chapter was created after this date */
    cFirstAfter?: Date | string;
    /** Ensure the first chapter was created before this date */
    cFirstBefore?: Date | string;
    /** All of the lists to filter by */
    lists?: string[];
    /** All of the people to filter by (author, artist, etc.) */
    people?: string[];
    /** All of the people to exclude from the search (author, artist, etc.) */
    peopleEx?: string[];
    /** Whether to match all people (AND - true) or any person (OR - false) */
    peopleAnd?: boolean;
    /** Whether to match all exclusion people (AND - true) or any exclusion person (OR - false) */
    peopleExAnd?: boolean;
}

/** The search filter for lists */
export interface ListSearchFilter extends SearchFiler<ListOrderBy> {
    /** The types of lists to search for */
    types?: ListType[];
}

/** The search filter for logs */
export interface LogSearchFilter extends SearchFiler<LogOrderBy> {
    /** The log levels to filter by */
    levels?: MbLogLevel[];
    /** The levels to exclude */
    levelsEx?: MbLogLevel[];
    /** The sources to filter by */
    sources?: string[];
    /** The sources to exclude */
    sourcesEx?: string[];
    /** The categories to filter by */
    categories?: string[];
    /** The categories to exclude */
    categoriesEx?: string[];
    /** The request ID to filter by */
    requestId?: string;
    /** Ensure the log was created after this date */
    after?: Date | string;
    /** Ensure the log was created before this date */
    before?: Date | string;
}

/** The search filter for profiles */
export interface ProfileSearchFilter extends SearchFiler<ProfileOrderBy> {
    /** The providers to filter by */
    providers?: string[];
    /** The provider IDs to filter by */
    providerIds?: string[];
    /** Whether or not the profile is an administrator */
    admin?: boolean;
    /** Whether or not the profile is approved to read */
    canRead?: boolean;
}

/** Filters for manga recommendation endpoints */
export interface RecommendationFilter {
    /** The size of the results */
    size?: number;
    /** Tags to include in the recommendations */
    tags?: string[];
    /** Tags to exclude from the recommendations */
    tagsEx?: string[];
    /** The ratings to filter by */
    ratings?: ContentRating[];
}

/** A snapshot of the current stats */
export interface Stats {
    /** The queue stats */
    queue: {
        /** When the snapshot was taken */
        timestamp: Date | string;
        /** The number of new manga in the queue */
        manga: number;
        /** The number of new chapters in the queue */
        chapters: number;
        /** The number of images in the queue */
        images: number;
    }[],
    /** The database stats */
    database: {
        /** The period of the database stats */
        period: string;
        /** The start of the stats period */
        start: Date | string;
        /** The end of the stats period */
        end: Date | string;
        /** The number of manga in the database */
        manga: number;
        /** The number of chapters in the database */
        chapters: number;
        /** The number of images in the database */
        images: number;
        /** The number of sources in the database */
        sources: number;
        /** The number of people in the database */
        people: number;
    }[]
}

/** Represents a related manga relationship */
export interface MbRelatedManga {
    /** The manga ID */
    mangaId: string;
    /** The work ID */
    workId: string;
    /** The source ID */
    sourceId: string;
}

/** The log meta-data */
export interface LogMetaData {
    /** The categories */
    categories: string[];
    /** The sources */
    sources: string[];
}

/** Represents the number of manga a person has read with the given tag */
export interface MbTagCount {
    /** The ID of the tag */
    tagId: string;
    /** The number of tags */
    tagCount: number;
}

/** A request to update a boolean profile field */
export interface UpdateBooleanRequest {
    /** The value to set */
    value: boolean;
}

/** A request to import a manga */
export interface ImportRequest {
    /** The ID of the source the manga should be imported against */
    sourceId: string;
    /** The ID of the profile to impersonate when importing the manga */
    profileId?: string;
    /** A manga to be imported */
    manga: ImportManga;
}

/** A manga to be imported */
export interface ImportManga {
    /** The title of the manga */
    title?: string;
    /** The original source ID of the manga */
    id?: string;
    /** The name of the provider the manga was loaded through */
    provider?: string;
    /** The URL of the manga on the original source site */
    homePage?: string;
    /** The URLs of the manga cover images */
    cover?: string[];
    /** The description of the manga */
    description?: string;
    /** Alternate descriptions for the manga */
    altDescriptions?: string[];
    /** Alternate titles for the manga */
    altTitles?: string[];
    /** The authors of the manga */
    authors?: string[];
    /** The artists of the manga */
    artists?: string[];
    /** The uploaders of the manga */
    uploaders?: string[];
    /** The content rating for the manga */
    rating?: ContentRating;
    /** The chapters of the manga to be imported */
    chapters?: ImportChapter[];
    /** Whether or not the manga is NSFW */
    nsfw?: boolean;
    /** The various attributes of the manga to be imported */
    attributes?: ImportAttribute[];
    /** The tags of the manga to be imported */
    tags?: ImportTag[];
    /** The referer to include when making XHR requests */
    referer?: string;
    /** The date the source manga was created */
    sourceCreated?: Date | string;
    /** Whether or not the chapter number resets whenever the volume number changes */
    ordinalVolumeReset: boolean;
    /** The optional legacy ID of the manga, if it existed in a previous version of the API */
    legacyId?: number;
}

/** A chapter to be imported with a manga */
export interface ImportChapter {
    /** The optional title of the chapter */
    title?: string;
    /** The URL of the chapter */
    url?: string;
    /** The original source ID of the chapter */
    id?: string;
    /** The chapter number */
    number: number;
    /** The volume number the chapter belongs to */
    volume?: number;
    /** The external URL of the chapter, if it's hosted on an external site */
    externalUrl?: string;
    /** The language of the chapter */
    language?: string;
    /** Optional attributes for the chapter */
    attributes?: ImportAttribute[];
    /** The optional legacy ID of the chapter, if it existed in a previous version of the API */
    legacyId?: number;
    /** The optional pages for the chapter */
    pages?: ImportPage[];
}

/** A page to be imported with a chapter */
export interface ImportPage {
    /** The URL of the page image */
    page?: string;
    /** The optional width of the image (in pixels) */
    width?: number;
    /** The optional height of the image (in pixels) */
    height?: number;
    /** Optional headers to include when fetching the headers */
    headers?: ImportAttribute[];
}

/** A tag to be imported with a manga */
export interface ImportTag {
    /** The name of the tag */
    name?: string;
    /** The optional slug of the tag */
    slug?: string;
}

/** A name-value pair for importing attributes for manga, chapters, and pages */
export interface ImportAttribute {
    /** The key / name of the attribute */
    name?: string;
    /** The value of the attribute */
    value?: string;
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

export type StateRollup = typeof STATE_ROLLUP[number];
