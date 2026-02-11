import type { EnumDescription } from '../api/composites';

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

export const PAGE_STYLES: EnumDescription<PageStyle>[] = [
    {
        value: PageStyle.SinglePageFit,
        name: 'Single Page (Fit to browser size)',
        description: 'Fits the page to the browser size'
    },
    {
        value: PageStyle.SinglePageFitToWidth,
        name: 'Single Page (Fit to browser width)',
        description: 'Fits the page to the browser width'
    },
    {
        value: PageStyle.SinglePageFitToHeight,
        name: 'Single Page (Fit to browser height)',
        description: 'Fits the page to the browser height'
    },
    {
        value: PageStyle.SinglePageNaturalSize,
        name: 'Single Page (Natural Image Size)',
        description: 'Displays the page at its natural image size'
    },
    {
        value: PageStyle.SinglePageMaxSize,
        name: 'Single Page (Custom Image Size)',
        description: 'Displays the page at a custom image size'
    },
    {
        value: PageStyle.DoublePage,
        name: '2 Pages Side-by-Side',
        description: 'Displays two pages side by side'
    },
    {
        value: PageStyle.LongStrip,
        name: 'Long Strip',
        description: 'Displays the pages in a long vertical strip'
    },
    {
        value: PageStyle.LongStripNaturalSize,
        name: 'Long Strip (Natural Image Size)',
        description: 'Displays the pages in a long vertical strip at their natural image size'
    },
    {
        value: PageStyle.LongStripMaxSize,
        name: 'Long Strip (Custom Image Size)',
        description: 'Displays the pages in a long vertical strip at a custom image size'
    },
];
