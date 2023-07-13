import { DbObject } from "../db-object.model";

export interface Bookmark extends DbObject {
    profileId: number;
    mangaId: number;
    mangaChapterId: number;
    pages: number[];
}