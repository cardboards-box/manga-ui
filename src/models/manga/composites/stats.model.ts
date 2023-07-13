export interface Stats {
    maxChapterNum: number;
    chapterNum: number;
    pageCount: number;
    chapterProgress: number;
    pageProgress: number;
    favourite: boolean;
    bookmarks: number[];
    hasBookmarks: boolean;
    latestChapter?: Date;
    completed: boolean;
    firstChapterId: number;
    progressChapterId?: number;
    progressId?: number;
}