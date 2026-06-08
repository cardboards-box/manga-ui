import type { Boxed, BoxedArray, BoxedPaged } from './base';
import type {
    MbMangaExt, MbProfile,
    MbList, MbApiKey,
    MbNotificationDevice, MbNotificationSubscription,
    MbPerson, MbSource,
} from './db';
import type {
    MbTypeChapter, MbTypeImage,
    MbTypeMangaSearch, MbTypeProgress,
    MbTypeManga, MbTypeList, MbTypeListSearch,
    MbTypeTag,
    MangaVolumes,
    EnumDescription, Stats,
    MbTypeProgressMulti,
} from './composites';
import type { FcmError } from './../enums';

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

export interface RespPersonSearch extends BoxedPaged<MbPerson> { }

export interface RespPeople extends BoxedArray<MbPerson> { }

export interface RespPerson extends Boxed<MbPerson> { }

export interface RespNotificationDevices extends BoxedArray<MbNotificationDevice> { }

export interface RespDeviceResult extends Boxed<{
    device: MbNotificationDevice;
    errors: SubscriptionError[];
}> { }

export interface RespNotificationSubscriptions extends BoxedArray<MbNotificationSubscription> { }

export interface RespSubscriptionResult extends Boxed<{
    subject: MbNotificationSubscription;
    errors: SubscriptionError[];
}> { }

export interface SubscriptionError {
    code?: FcmError;
    reason?: string;
    exception?: string;
}

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

export interface ReqNotificationSettings {
    favourites: boolean;
    inProgress: boolean;
}

export interface ReqListImportMd {
    mdListId: string;
    isPublic: boolean;
    name?: string;
    description?: string;
}

export interface MbListImportResponse {
    failures: { [key: string]: string; };
    list: MbTypeList;
}

export interface MbSlice {
    ordinal: number;
    imageId: string;
    startY: number;
    endY: number;
}

export interface MbSlicedImage {
    ordinal: number;
    slices: MbSlice[];
}

export interface RespMetadataEnums<T = number> extends BoxedArray<EnumDescription<T>> { }

export interface RespMetadataTags extends BoxedArray<MbTypeTag> { }

export interface RespMetadataSource extends BoxedArray<MbSource> { }

export interface RespStats extends Boxed<Stats> { }

export interface RespListImport extends Boxed<MbListImportResponse> { }
