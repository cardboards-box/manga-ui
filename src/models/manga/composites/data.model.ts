import { Chapter, Volume } from "../chapter.model";
import { Progress } from "../progress.model";
import { MangaWithChapters } from "./manga-with-chapters.model";
import { Stats } from "./stats.model";

export interface MangaData extends MangaWithChapters {
    chapter: Chapter;
    volumes: Volume[];
    progress?: Progress;
    stats?: Stats;
}