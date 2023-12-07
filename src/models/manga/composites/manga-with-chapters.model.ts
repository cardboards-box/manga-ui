import type { Bookmark } from "../bookmark.model";
import type { Chapter } from "../chapter.model";
import type { Manga } from "../manga.model";
import type { Progress } from "../progress.model";
import type { Stats } from "./stats.model";

export type VolumeSort = 'ordinal' | 'date' | 'language' | 'title' | 'read';

export interface MangaWithChaptersBase {
    manga: Manga;
    bookmarks: Bookmark[];
    favourite: boolean;
}

export interface MangaWithChapters extends MangaWithChaptersBase {
    chapters: Chapter[];
}

export interface MangaVolumed extends MangaWithChaptersBase {
    chapter?: Chapter;
    volumes: MangaVolume[];
    progress?: Progress;
    stats?: Stats;

    volumeIndex: number;
    favourite: boolean;
}

export interface MangaVolume {
    name?: number;
    collapse: boolean;
    read: boolean;
    inProgress: boolean;
    chapters: MangaVolumeChapter[]
}

export interface MangaVolumeChapter {
    read: boolean;
    readIndex?: number;
    pageIndex?: number;
    open: boolean;
    progress?: number;

    versions: Chapter[];
}
