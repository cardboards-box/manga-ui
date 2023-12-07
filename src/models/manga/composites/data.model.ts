import type { Chapter, Volume } from "../chapter.model";
import type { Progress } from "../progress.model";
import type { MangaWithChapters } from "./manga-with-chapters.model";
import type { Stats } from "./stats.model";

export interface MangaData extends MangaWithChapters {
    chapter: Chapter;
    volumes: Volume[];
    progress?: Progress;
    stats?: Stats;
}
