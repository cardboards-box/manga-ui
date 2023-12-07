import type { Chapter } from "./chapter.model";
import type { DbObject } from "../db-object.model";
import type { Manga } from "./manga.model";
import type { Stats } from "./composites/stats.model";

export interface Progress extends DbObject {
    profileId: number;
    mangaId: number;
    mangaChapterId: number;
    pageIndex: number;
    read: { chapterId: number, pageIndex: number }[];
}

export interface ProgressExt {
    manga: Manga;
    progress?: Progress;
    chapter: Chapter;
    stats: Stats;
}
