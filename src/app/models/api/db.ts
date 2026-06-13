import type { MbDbObject, MbDbObjectLegacy } from './base';

export const APPLICATION_START_DATE = new Date(2022, 0, 1);

/** Indicates that a user advisory is recommended */
export enum ContentRating {
    /** No advisory is necessary */
	Safe = 0,
    /** Content contains suggestive material that might not be safe for work */
    Suggestive = 1,
    /** Content contains sexual themes or censored nudity (without explicit sexual acts) */
    Erotica = 2,
    /** Content contains explicit sexual acts or nudity */
    Pornographic = 3,
}

export enum RelationshipType {
    /** A manga author relationship */
    Author = 0,
    /** A manga artist relationship */
    Artist = 1,
    /** A manga uploader relationship */
    Uploader = 2
}

/** The various levels of logs */
export enum MbLogLevel {
    /** Trace log level */
    Trace = 0,
    /** Debug log level */
    Debug = 1,
    /** Information log level */
    Information = 2,
    /** Warning log level */
    Warning = 3,
    /** Error log level */
    Error = 4,
    /** Critical log level */
    Critical = 5,
    /** None log level */
    None = 6,
}

/** Represents an attribute for a manga or chapter */
export interface MbAttribute {
    /** The name of the attribute */
    name: string;
    /** The value of the attribute */
    value: string;
}

/** Represents a chapter associated with a manga */
export interface MbChapter extends MbDbObjectLegacy {
    /** The ID of the manga this chapter belongs to */
    mangaId: string;
    /** The title of the chapter */
    title?: string;
    /** The URL to the chapter on the source */
    url?: string;
    /** The ID of the chapter on the source */
    sourceId: string;
    /** The chapter number */
    ordinal: number;
    /** The volume the chapter belongs to */
    volume?: number;
    /** The language the chapter is in */
    language?: string;
    /** The number of pages the chapter has */
    pageCount?: number;
    /** The place where you can read the chapter if MB cannot scrape the pages */
    externalUrl?: string;
    /** The optional attributes for the chapter */
    attributes: MbAttribute[];
}

/** Represents the progess of a profile in a chapter */
export interface MbChapterProgress extends MbDbObject {
    /** The ID of the manga progress entity this belongs to */
    progressId: string;
    /** The ID of the chapter this progress belongs to */
    chapterId: string;
    /** The ordinal of the page the user is currently on */
    pageOrdinal?: number;
    /** The page ordinals that have been bookmarked in this chapter */
    bookmarks: number[];
    /** The last time the user read the chapter */
    lastRead?: Date | string;
}

/** An image for either a chapter or a manga cover */
export interface MbImage extends MbDbObject {
    /** The URL to the image */
    url: string;
    /** The ID of the chapter this image belongs to, if applicable. If the image is a chapter page, this will be filled in */
    chapterId?: string;
    /** The ID of the manga this image belongs to */
    mangaId: string;
    /** The ordinal position of the image within its chapter or manga */
    ordinal: number;
    /** The file name of the image */
    fileName?: string;
    /** A hash of the URL */
    urlHash?: string;
    /** The width of the image in pixels */
    imageWidth?: number;
    /** The height of the image in pixels */
    imageHeight?: number;
    /** The size of the image in bytes */
    imageSize?: number;
    /** The MIME type of the image */
    mimeType?: string;
    /** The slice data for the image, if applicable */
    slices: {
        /** The ID of the original image */
        image: string;
        /** The ordinal of the slice in the new image */
        ordinal: number;
        /** The start Y coordinate of the slice */
        start: number;
        /** The stop Y coordinate of the slice */
        stop: number;
    }[];
}

/** All of the manga that are present on MangaBox */
export interface MbManga extends MbDbObjectLegacy {
    /** The series' titles */
    title: string;
    /** The series' alternative titles */
    altTitles: string[];
    /** The manga's primary description */
    description?: string;
    /** The manga's alternate descriptions */
    altDescriptions: string[];
    /** The manga's source URL */
    url: string;
    /** All of the extra attributes for the manga */
    attributes: MbAttribute[];
    /** The content rating for the manga */
    contentRating: ContentRating;
    /** Whether or not the manga is NSFW */
    nsfw: boolean;
    /** The ID of the source provider the series belongs to */
    sourceId: string;
    /** The unique ID of the series on the original source */
    originalSourceId: string;
    /** Whether or not the manga is hidden from the public */
    isHidden: boolean;
    /** When the manga was created on the source provider */
    sourceCreated?: Date | string;
    /** Whether or not the chapter ordinals reset for each volume */
    ordinalVolumeReset: boolean;
    /** Indicates that the same manga is available on other sources */
    workId?: string;
}

/** Represents extended information about a manga */
export interface MbMangaExt extends MbDbObject {
    /** The ID of the manga this extension belongs to */
    mangaId: string;
    /** The total number of chapters in the manga */
    chapterCount: number;
    /** The total number of unique chapters in the manga */
    uniqueChapterCount: number;
    /** The last chapter ordinal number in the manga */
    lastChapterOrdinal: number;
    /** The first chapter ordinal number in the manga */
    firstChapterOrdinal: number;
    /** The date/time the latest chapter was uploaded */
    lastChapterCreated: Date | string;
    /** The date/time the first chapter was uploaded */
    firstChapterCreated: Date | string;
    /** The ID of the last chapter released */
    lastChapterId?: string;
    /** The ID of the first chapter released */
    firstChapterId?: string;
    /** The total number of volumes in the manga */
    volumeCount: number;
    /** The average number of days between uploads to the manga */
    daysBetweenUpdates: number;
    /** The total number of people who have viewed this manga on MB */
    views: number;
    /** The total number of people who have favourited this manga on MB */
    favorites: number;
    /** The override display title for the manga */
    displayTitle?: string;
}

/** The bridge between manga and profiles, indicating a user's progress through the manga */
export interface MbMangaProgress extends MbDbObject {
    /** The ID of the profile this progress belongs to */
    profileId: string;
    /** The ID of the manga this progress belongs to */
    mangaId: string;
    /** The last read chapter ordinal number */
    lastReadOrdinal?: number;
    /** The ID of the last chapter read */
    lastReadChapterId?: string;
    /** The date/time the manga was last read */
    lastReadAt?: Date | string;
    /** Whether the manga is marked as completed */
    isCompleted: boolean;
    /** Whether or not the user has favorited the manga */
    favorited: boolean;
    /** The user's progress through the manga */
    progressPercentage: number;
}

/** A person related to a manga or MangaBox profile */
export interface MbMangaRelationship extends MbDbObject {
    /** The ID of the manga */
    mangaId: string;
    /** The ID of the person */
    personId: string;
    /** The relationship type */
    type: RelationshipType;
}

/** A tag assignment for a manga */
export interface MbMangaTag extends MbDbObject {
    /** The ID of the manga */
    mangaId: string;
    /** The ID of the tag */
    tagId: string;
}

/** Represents a person that does things */
export interface MbPerson extends MbDbObject {
    /** The person's name */
    name: string;
    /** The URL of the person's avatar */
    avatar?: string;
    /** Whether or not the person is an artist of a manga */
    artist: boolean;
    /** Whether or not the person is an author of a manga */
    author: boolean;
    /** Whether or not the person is a user of MB */
    user: boolean;
    /** The ID of the user's MB profile, if applicable */
    profileId?: string;
}

/** Represents a person who has logged into MangaBox */
export interface MbProfile extends MbDbObjectLegacy {
    /** The user's name */
    username: string;
    /** The user's avatar */
    avatar?: string;
    /** The ID of the user within CBA auth */
    platformId: string;
    /** The name of the OAuth platform the user signed in with */
    provider: string;
    /** The unique ID of the user on the OAuth platform the user signed in with */
    providerId: string;
    /** The user's email */
    email: string;
    /** The optional JSON blob of settings for the user */
    settingsBlob?: string;
    /** Whether or not the user is an administrator */
    admin: boolean;
    /** Whether or not the user can read manga on the platform */
    canRead: boolean;
    /** Whether or not the user wants to receive notifications for their favourite manga */
    notifyFavourites: boolean;
    /** Whether or not the user wants to receive notifications for manga they are currently reading */
    notifyInProgress: boolean;
}

/** All of the source providers that MangaBox supports */
export interface MbSource extends MbDbObject {
    /** The unique slug of the source */
    slug: string;
    /** The name of the source */
    name: string;
    /** The base URL to use for the source */
    baseUrl: string;
    /** Whether or not the source is hidden from the public */
    isHidden: boolean;
    /** Whether or not the source is enabled */
    enabled: boolean;
    /** The default content rating for manga from the source */
    defaultRating: ContentRating;
}

/** Represents all of the tags MangaBox supports */
export interface MbTag extends MbDbObject {
    /** The slug of the chapter */
    slug: string;
    /** The name of the tag */
    name: string;
    /** The description of the tag */
    description?: string;
    /** The source that originally loaded this tag */
    sourceId: string;
}

/** Extended tag metadata used by MangaBox relationships */
export interface MbTagExt {
    /** The ID of the tag */
    id: string;
    /** Whether or not the tag is shared */
    shared: boolean;
    /** The number of manga with this tag */
    manga: number;
    /** The content rating associated with the tag */
    rating?: ContentRating;
    /** The source associated with the tag */
    source?: string;
}

/** Represents a list of manga that a user has created */
export interface MbList extends MbDbObject {
    /** The ID of the profile that owns this list */
    profileId: string;
    /** The name of the list */
    name: string;
    /** The list this list was cloned from, if any */
    clonedFrom?: string;
    /** The optional description of the list */
    description?: string;
    /** Whether or not the list is public */
    isPublic: boolean;
}

/** A manga entry inside a list */
export interface MbListItem extends MbDbObject {
    /** The ID of the list */
    listId: string;
    /** The ID of the manga */
    mangaId: string;
}

/** Extended information about a list */
export interface MbListExt extends MbDbObject {
    /** The ID of the list this extension belongs to */
    listId: string;
    /** The ID of the list cover image */
    coverId?: string;
    /** The number of manga in this list */
    mangaCount: number;
    /** The number of times this list has been cloned */
    clonedCount: number;
}

/** Represents an API key for authenticating with the API */
export interface MbApiKey extends MbDbObject {
    /** The name of the API key */
    name: string;
    /** The ID of the profile this API key belongs to */
    profileId: string;
}

/** Represents a group of related manga across sources */
export interface MbWork extends MbDbObject { }

/** All of the notification devices registered to a user */
export interface MbNotificationDevice extends MbDbObject {
    /** The ID of the profile that owns this notification device */
    profileId: string;
    /** The display name for the device */
    name: string;
    /** The FCM token for this notification device */
    fcmToken: string;
    /** Whether or not the token is active */
    active: boolean;
}

/** The notification subscriptions for a profile */
export interface MbNotificationSubscription extends MbDbObject {
    /** The ID of the profile that owns this subscription */
    profileId: string;
    /** The ID of the manga this subscription is for */
    mangaId?: string;
    /** The ID of the person this subscription is for */
    personId?: string;
}

/** A table for logging various events in the application */
export interface MbLog extends MbDbObject {
    /** The log level */
    logLevel: MbLogLevel;
    /** The category the log belongs to */
    category?: string;
    /** The context source for the event */
    source?: string;
    /** The message of the log */
    message?: string;
    /** The exception message if one is present */
    exception?: string;
    /** The context of the log */
    context?: string;
}
