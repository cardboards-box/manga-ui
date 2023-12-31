import type { DbObject } from "../db-object.model";

export interface Manga extends DbObject {
    hashId: string;
    title: string;
    sourceId: string;
    provider: string;
    url: string;
    cover: string;
    tags: string[];
    altTitles: string[];
    description: string;
    nsfw: boolean;
    referer?: string;
    displayTitle?: string;
    uploader?: number;
    ordinalVolumeReset: boolean;

    attributes: {
        name: string;
        value: string;
    }[];
}
