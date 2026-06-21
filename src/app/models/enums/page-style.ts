import type { EnumDescription } from '../api/composites';

export enum PageStyle {
    SinglePageFit = 'single-page fit',
    SinglePageFitToWidth = 'single-page fit-to-width',
    SinglePageFitToHeight = 'single-page fit-to-height',
    SinglePageNaturalSize = 'single-page natural-size',
    SinglePageMaxSize = 'single-page max-size',
    DoublePage = 'double-page fit',
    DoublePageFitToWidth = 'double-page fit-to-width',
    DoublePageFitToHeight = 'double-page fit-to-height',
    DoublePageNaturalSize = 'double-page natural-size',
    DoublePageMaxSize = 'double-page max-size',
    LongStrip = 'long-strip',
    LongStripFit = 'long-strip fit',
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
        name: 'Double Page (Fit to browser size)',
        description: 'Fits the pages to the browser size'
    },
    {
        value: PageStyle.DoublePageFitToWidth,
        name: 'Double Page (Fit to browser width)',
        description: 'Fits the pages to the browser width'
    },
    {
        value: PageStyle.DoublePageFitToHeight,
        name: 'Double Page (Fit to browser height)',
        description: 'Fits the pages to the browser height'
    },
    {
        value: PageStyle.DoublePageNaturalSize,
        name: 'Double Page (Natural Image Size)',
        description: 'Displays the pages at their natural image size'
    },
    {
        value: PageStyle.DoublePageMaxSize,
        name: 'Double Page (Custom Image Size)',
        description: 'Displays the pages at a custom image size'
    },
    {
        value: PageStyle.LongStrip,
        name: 'Long Strip (Fit to browser width)',
        description: 'Displays the pages in a long vertical strip'
    },
    {
        value: PageStyle.LongStripNaturalSize,
        name: 'Long Strip (Natural Image Size)',
        description: 'Displays the pages in a long vertical strip at their natural image size'
    },
    {
        value: PageStyle.LongStripFit,
        name: 'Long Strip (Capped to browser width)',
        description: 'Displays the pages in a long vertical strip fit to the browser width'
    },
    {
        value: PageStyle.LongStripMaxSize,
        name: 'Long Strip (Custom Image Size)',
        description: 'Displays the pages in a long vertical strip at a custom image size'
    },
];

export const PAGE_STYLES_LONGSTRIP = [...PAGE_STYLES.filter(s => s.value.toLowerCase().includes('long-strip'))] as const;
