export interface ImageSearchManga {
    title: string;
    id: string;
    url: string;
    description: string;
    source: string;
    nsfw: boolean;
    cover: string;
    tags: string[];
}

export interface BaseResult {
    score: number;
    source: 'cba fallback' | 'google vision' | 'title lookup' | 'sauce nao'
    exactMatch: boolean;
    manga: ImageSearchManga;
}

export interface VisionResult extends BaseResult {
    url: string;
    title: string;
    filteredTitle: string;
}

export interface MatchResult extends BaseResult {
    metadata: {
        id: string;
        url: string;
        source: string;
        type: number;
        mangaId: string;
        chapterId?: string;
        page?: number;
    };
}

export interface ImageSearch {
    vision: VisionResult[];
    match: MatchResult[];
    textual: BaseResult[];

    bestGuess?: ImageSearchManga;
}