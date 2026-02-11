import type { MbDbObject, MbDbObjectLegacy } from './base';

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
    Author = 0,
    Artist = 1,
    Uploader = 2
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
    /** The URL of the chapter on the source */
    url?: string;
    /** The ID of the chapter on the source */
    sourceId: string;
    /** The chapter number */
    ordinal: number;
    /** The volume the chapter belongs to */
    volume?: number;
    /** The language the chapter is in */
    language: string;
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
}

//I gave up doing comments... Just refer to the API
/** Represents extended information about a manga */
export interface MbMangaExt extends MbManga {
    mangaId: string;
    chapterCount: number;
    uniqueChapterCount: number;
    lastChapterOrdinal: number;
    firstChapterOrdinal: number;
    lastChapterCreated: Date | string;
    firstChapterCreated: Date | string;
    lastChapterId?: string;
    firstChapterId?: string;
    volumeCount: number;
    daysBetweenUpdates: number;
    views: number;
    favorites: number;
    displayTitle?: string;
}

export interface MbMangaProgress extends MbDbObject {
    profileId: string;
    mangaId: string;
    lastReadOrdinal?: number;
    lastReadChapterId?: string;
    lastReadAt?: Date | string;
    isCompleted: boolean;
    favorited: boolean;
    progressPercentage: number;
}

export interface MbMangaRelationship extends MbDbObject {
    mangaId: string;
    personId: string;
    type: RelationshipType;
}

export interface MbMangaTag extends MbDbObject {
    mangaId: string;
    tagId: string;
}

export interface MbPerson extends MbDbObject {
    name: string;
    avatar?: string;
    artist: boolean;
    author: boolean;
    user: boolean;
    profileId?: string;
}

export interface MbProfile extends MbDbObjectLegacy {
    username: string;
    avatar?: string;
    platformId: string;
    provider: string;
    providerId: string;
    email: string;
    settingsBlob?: string;
    admin: boolean;
    canRead: boolean;
}

export interface MbSource extends MbDbObject {
    slug: string;
    name: string;
    baseUrl: string;
    isHidden: boolean;
    enabled: boolean;
}

export interface MbTag extends MbDbObject {
    slug: string;
    name: string;
    description?: string;
    sourceId: string;
}
