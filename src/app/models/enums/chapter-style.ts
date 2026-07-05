import type { EnumDescription } from '../api/composites';

export enum ChapterStyle {
    Volumes = 'volumes',
    VolumesReversed = 'volumes reversed',
    Chapters = 'chapters',
    ChaptersReversed = 'chapters reversed',
}

export const CHAPTER_STYLES: EnumDescription<ChapterStyle>[] = [
    {
        value: ChapterStyle.Volumes,
        name: 'Volumes',
        description: 'Displays the chapters grouped by volume',
    }, {
        value: ChapterStyle.VolumesReversed,
        name: 'Volumes Reversed',
        description: 'Displays the chapters grouped by volume in descending order',
    }, {
        value: ChapterStyle.Chapters,
        name: 'Chapters',
        description: 'Displays the chapters in a single list',
    }, {
        value: ChapterStyle.ChaptersReversed,
        name: 'Chapters Reversed',
        description: 'Displays the chapters in a single list in descending order',
    }
];