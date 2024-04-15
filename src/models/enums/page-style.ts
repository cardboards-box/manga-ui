import type { EnumDescriptions } from './base';

export enum PageStyle {
    Single = 'single',
    Double = 'double',
    LongStrip = 'longstrip',
}

export const PAGE_STYLES_ALL: EnumDescriptions<PageStyle> = [
    {
        value: PageStyle.Single,
        display: 'One image per page',
        enabled: true,
    },
    {
        value: PageStyle.Double,
        display: '2 Pages Side-by-Side',
        enabled: true,
    },
    {
        value: PageStyle.LongStrip,
        display: 'Long Strip (Webtoon)',
        enabled: true,
    }
];

export const PAGE_STYLES = PAGE_STYLES_ALL.filter((style) => style.enabled);
