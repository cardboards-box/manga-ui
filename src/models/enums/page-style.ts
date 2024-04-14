import type { EnumDescriptions } from './base';

export enum PageStyle {
    SinglePageFit = 'single-page fit',
    SinglePageFitToWidth = 'single-page fit-to-width',
    SinglePageFitToHeight = 'single-page fit-to-height',
    SinglePageNaturalSize = 'single-page natural-size',
    SinglePageMaxSize = 'single-page max-size',
    DoublePage = 'double-page',
    LongStrip = 'long-strip',
    LongStripNaturalSize = 'long-strip natural-size',
    LongStripMaxSize = 'long-strip max-size',
}

export const PAGE_STYLES_ALL: EnumDescriptions<PageStyle> = [
    {
        value: PageStyle.SinglePageFit,
        display: 'Single Page (Fit to browser size)',
        enabled: true,
    },
    {
        value: PageStyle.SinglePageFitToWidth,
        display: 'Single Page (Fit to browser width)',
        enabled: true,
    },
    {
        value: PageStyle.SinglePageFitToHeight,
        display: 'Single Page (Fit to browser height)',
        enabled: true,
    },
    {
        value: PageStyle.SinglePageNaturalSize,
        display: 'Single Page (Natural Image Size)',
        enabled: true,
    },
    {
        value: PageStyle.SinglePageMaxSize,
        display: 'Single Page (Custom Image Size)',
        enabled: false,
    },
    {
        value: PageStyle.DoublePage,
        display: '2 Pages Side-by-Side',
        enabled: true,
    },
    {
        value: PageStyle.LongStrip,
        display: 'Long Strip',
        enabled: true,
    },
    {
        value: PageStyle.LongStripNaturalSize,
        display: 'Long Strip (Natural Image Size)',
        enabled: true,
    },
    {
        value: PageStyle.LongStripMaxSize,
        display: 'Long Strip (Custom Image Size)',
        enabled: false,
    },
];

export const PAGE_STYLES = PAGE_STYLES_ALL.filter((style) => style.enabled);
