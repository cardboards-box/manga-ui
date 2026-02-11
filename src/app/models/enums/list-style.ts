import type { EnumDescription } from '../api/composites';

export enum ListStyle {
    Expanded = 'expanded',
    Compact = 'compact',
    Album = 'album'
}

export const LIST_STYLES: EnumDescription<ListStyle>[] = [
    {
        value: ListStyle.Expanded,
        name: 'Manga Card (Expanded)',
        description: 'Displays the most information about the manga',
    },
    {
        value: ListStyle.Compact,
        name: 'Manga Card (Compact)',
        description: 'Displays only the essential information about the manga',
    },
    {
        value: ListStyle.Album,
        name: 'Album Cover',
        description: 'Displays the manga\'s cover and title only',
    },
];

