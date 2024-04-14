import type { EnumDescriptions } from './base';

export enum ListStyle {
    Expanded = 'expanded',
    Compact = 'compact',
    Album = 'album'
}

export const LIST_STYLES_ALL: EnumDescriptions<ListStyle> = [
    {
        value: ListStyle.Expanded,
        display: 'Manga Card (Expanded)',
        enabled: true,
    },
    {
        value: ListStyle.Compact,
        display: 'Manga Card (Compact)',
        enabled: true,
    },
    {
        value: ListStyle.Album,
        display: 'Album Cover',
        enabled: true,
    },
];

export const LIST_STYLES = LIST_STYLES_ALL.filter((style) => style.enabled);
