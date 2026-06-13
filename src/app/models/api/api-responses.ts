import type { Boxed, BoxedArray, BoxedEmpty, BoxedPaged } from './base';
import type {
    MbMangaExt, MbProfile,
    MbList, MbApiKey,
    MbNotificationDevice, MbNotificationSubscription,
    MbPerson, MbSource, MbLog,
} from './db';
import type {
    MbTypeChapter, MbTypeImage,
    MbTypeMangaSearch, MbTypeProgress,
    MbTypeManga, MbTypeList, MbTypeListSearch,
    MbTypeTag,
    MangaVolumes,
    EnumDescription, Stats,
    MbTypeProgressMulti,
    LogMetaData, MbTagCount,
} from './composites';
import type { FcmError } from './../enums';

/** The response to an auth request */
export interface RespAuthResolve extends Boxed<{
    /** The MangaBox profile */
    profile: MbProfile;
    /** The JWT token */
    token: string;
}> { }

/** Fetches the current user's profile */
export interface RespAuthMe extends Boxed<MbProfile> { }

/** Fetches a chapter by its ID */
export interface RespChapter extends Boxed<MbTypeChapter> { }

/** Fetches or updates manga progress */
export interface RespProgress extends Boxed<MbTypeProgress> { }

/** Fetches all of the manga progress by the given IDs */
export interface RespProgresses extends BoxedArray<MbTypeProgressMulti> { }

/** Gets the image metadata by its ID */
export interface RespImage extends Boxed<MbTypeImage> { }

/** Searches for manga based on the given filter */
export interface RespMangaSearch extends BoxedPaged<MbTypeMangaSearch> { }

/** Finds the recommended manga */
export interface RespMangaRecommendations extends BoxedArray<MbTypeMangaSearch> { }

/** Fetches a manga by its ID */
export interface RespManga extends Boxed<MbTypeManga> { }

/** Fetches all of the chapters of the given manga */
export interface RespMangaChapters extends Boxed<MangaVolumes> { }

/** Recomputes the extension data for the given manga */
export interface RespMangaRecompute extends BoxedArray<MbMangaExt[]> { }

/** Sets the display title of the given manga */
export interface RespMangaSet extends Boxed<MbMangaExt> { }

/** Fetches, creates, updates, or mutates a list */
export interface RespList extends Boxed<MbTypeList> { }

/** Fetches all of the lists for the current user */
export interface RespLists extends BoxedArray<MbList> { }

/** Searches for lists based on the given filter */
export interface RespListSearch extends BoxedPaged<MbTypeListSearch> { }

/** Fetches the current profile's API keys */
export interface RespApiKeys extends BoxedArray<MbApiKey> { }

/** Creates a new API key */
export interface RespApiKey extends Boxed<MbApiKey> { }

/** Fetches the key value from an API key */
export interface RespApiKeyKey extends Boxed<string> { }

/** Searches for people by name */
export interface RespPersonSearch extends BoxedPaged<MbPerson> { }

/** Gets multiple people by their IDs */
export interface RespPeople extends BoxedArray<MbPerson> { }

/** Gets a person by their ID */
export interface RespPerson extends Boxed<MbPerson> { }

/** Searches profiles by the given filter */
export interface RespProfileSearch extends BoxedPaged<MbProfile> { }

/** Gets all profile providers */
export interface RespProfileProviders extends BoxedArray<string> { }

/** Gets all of a user's registered devices */
export interface RespNotificationDevices extends BoxedArray<MbNotificationDevice> { }

/** The result of a device subscription attempt */
export interface RespDeviceResult extends Boxed<{
    /** The registered notification device */
    device: MbNotificationDevice;
    /** Any error that occurred while subscribing */
    errors: SubscriptionError[];
}> { }

/** Gets all of a user's subscriptions */
export interface RespNotificationSubscriptions extends BoxedArray<MbNotificationSubscription> { }

/** The result of a subject subscription attempt */
export interface RespSubscriptionResult extends Boxed<{
    /** The notification subscription */
    subject: MbNotificationSubscription;
    /** Any error that occurred while subscribing */
    errors: SubscriptionError[];
}> { }

/** Represents an error message from a subscription attempt */
export interface SubscriptionError {
    /** The FCM error code */
    code?: FcmError;
    /** The error reason */
    reason?: string;
    /** The error exception */
    exception?: string;
}

/** The request body to load a manga */
export interface ReqMangaLoad {
    /** The URL of the manga to load */
    url: string;
    /** Whether to force the load even if the manga already exists */
    force?: boolean;
}

/** The request to set the display title for the manga */
export interface ReqMangaSetDisplay {
    /** The ID of the manga */
    mangaId: string;
    /** The display title to set */
    display?: string;
}

/** A request to create an API key */
export interface ReqMangaApiKey {
    /** The name of the API key to create */
    name?: string;
}

/** The settings for notifications related to a profile */
export interface ReqNotificationSettings {
    /** Whether or not the user wants to receive notifications for their favourite manga */
    favourites: boolean;
    /** Whether or not the user wants to receive notifications for manga they are currently reading */
    inProgress: boolean;
}

/** Imports a list from the MD API */
export interface ReqListImportMd {
    /** The ID of the list on MangaDex */
    mdListId?: string;
    /** Whether the list is public */
    isPublic: boolean;
    /** The optional name to use for the list */
    name?: string;
    /** The description of the list */
    description?: string;
}

/** The response from importing a list from an external source */
export interface MbListImportResponse {
    /** The failures for the import request */
    failures?: { [key: string]: string; };
    /** The imported list */
    list: MbTypeList;
}

/** A slice of an image to build */
export interface MbSlice {
    /** The ordinal of the slice in the image */
    ordinal: number;
    /** The ID of the image */
    imageId: string;
    /** The starting Y coordinate of the slice */
    startY: number;
    /** The ending Y coordinate of the slice */
    endY: number;
}

/** The image to build from slices */
export interface MbSlicedImage {
    /** The ordinal of the image in the chapter */
    ordinal: number;
    /** The slices of the original image to create an image from */
    slices: MbSlice[];
}

/** Gets enum metadata */
export interface RespMetadataEnums<T = number> extends BoxedArray<EnumDescription<T>> { }

/** Gets the manga tags */
export interface RespMetadataTags extends BoxedArray<MbTypeTag> { }

/** Gets the manga sources */
export interface RespMetadataSource extends BoxedArray<MbSource> { }

/** Gets the stats snapshot of the application */
export interface RespStats extends Boxed<Stats> { }

/** Imports a list from MD */
export interface RespListImport extends Boxed<MbListImportResponse> { }

/** Fetches the log by the given ID */
export interface RespLog extends Boxed<MbLog> { }

/** Searches for logs */
export interface RespLogSearch extends BoxedPaged<MbLog> { }

/** Fetches the log metadata for searching */
export interface RespLogMetaData extends Boxed<LogMetaData> { }

/** Gets the tag graph for the user's library */
export interface RespTagGraph extends BoxedArray<MbTagCount> { }

/** Returns a boxed integer result */
export interface RespInt32 extends Boxed<number> { }

/** Returns an empty boxed result */
export interface RespBoxed extends BoxedEmpty { }
