export interface Strip {
    chapterId: number;
    page: number;
}

export interface StripReq {
    mangaId: number;
    pages: Strip[];
}