import { Chapter } from "./chapter.model";
import { DbObject } from "../db-object.model";
import { Manga } from "./manga.model";
import { Stats } from "./composites/stats.model";

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