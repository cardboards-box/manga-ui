export interface Filter {
    page: number;
    size: number;
    search?: string;
    asc: boolean;
    include: string[];
    exclude: string[];
    sources: string[];
    sort?: number;
    state?: number;
    nsfw?: number;
    attributes: {
        type: AttributeType;
        include: boolean;
        values: string[];
    }[];
}

export enum AttributeType {
    ContentRating = 1,
	OriginalLanguage = 2,
	Status = 3,
}

export interface FilterDefintion {
    key: string;
    values: string[];
}

export type States = 'favourite' | 'completed' | 'inprogress' | 'bookmarked' | 'else' | 'touched' | 'all' | number;

export type Filters = FilterDefintion[];