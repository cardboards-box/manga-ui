
/**
 * The base interface for API responses
 */
export interface BoxedBase {
    /** The HTTP status code of the response */
    code: number;
    /** A breif description of the error */
    description?: string;
    /** Any issues that occurred */
    errors?: string[];
    /** The number of milliseconds the request took to complete */
    elapsed: number;
    /** The unique identifier for the request */
    requestId: string;
}

/**
 * The interface for API error responses
 */
export interface BoxedError extends BoxedBase {
    /** The type of the result */
    type: 'error';
}

/**
 * The interface for API responses with no data
 */
export interface BoxedEmpty extends BoxedBase {
    /** The type of the result */
    type: 'ok';
}

/**
 * The interface for API responses with data
 */
export interface Boxed<Data = any> extends BoxedBase {
    /** The type of the result */
    type: 'data';
    /** The data returned by the API */
    data: Data;
}

/**
 * The interface for API responses with an array of data
 */
export interface BoxedArray<Data = any> extends BoxedBase {
    /** The type of the result */
    type: 'array';
    /** The data returned by the API */
    data: Data[];
}

/**
 * The interface for API responses with paged data
 */
export interface BoxedPaged<Data = any> extends BoxedBase {
    /** The type of the result */
    type: 'paged';
    /** The data returned by the API */
    data: Data[];
    /** The total number of pages available */
    pages: number;
    /** The total number of items available */
    total: number;
}

/**
 * The interface for database objects
 */
export interface MbDbObject {
    /** The ID of the entity */
    id: string;

    /** The date the entity was created */
    createdAt: Date | string;
    /** The date the entity was last updated */
    updatedAt: Date | string;
    /** The date the entity was deleted */
    deletedAt?: Date | string;
}

/**
 * The interface for database objects that were migrated from a legacy system
 */
export interface MbDbObjectLegacy extends MbDbObject {
    /** The ID of the entity in the legacy system */
    legacyId?: number;
}

export interface ApiConfig {
    token: string | undefined;
    apiUrl: string;
    prod: boolean;
}

export type CacheResolver = () => ApiConfig | undefined;

export type ApiResult<T extends BoxedBase> = BoxedError | T;
