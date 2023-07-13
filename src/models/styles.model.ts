export enum PageStyle {
    SinglePageFit = 'single-page fit',
    SinglePageFitToWidth = 'single-page fit-to-width',
    SinglePageFitToHeight = 'single-page fit-to-height',
    SinglePageNaturalSize = 'single-page natural-size',
    DoublePage = 'double-page',
    LongStrip = 'long-strip'
}

export const PAGE_STYLES = [
    PageStyle.SinglePageFit,
    PageStyle.SinglePageFitToWidth,
    PageStyle.SinglePageFitToHeight,
    PageStyle.SinglePageNaturalSize,
    PageStyle.DoublePage,
    PageStyle.LongStrip
]

export enum ProgressBarStyle {
    None = 'none',
    Bottom = 'bottom',
    Left = 'left',
    Right = 'right'
}

export const PROGRESS_BAR_STYLES = [
    ProgressBarStyle.None,
    ProgressBarStyle.Bottom,
    ProgressBarStyle.Left,
    ProgressBarStyle.Right
]

export enum FilterStyle {
    None = 'none',
    Invert = 'invert',
    BlueLight = 'blue-light',
    BluePrint = 'blue-print',
    Custom = 'custom'
}

export const FILTER_STYLES = [
    FilterStyle.None,
    FilterStyle.Invert,
    FilterStyle.BlueLight,
    FilterStyle.BluePrint,
    FilterStyle.Custom
]

export enum ListStyle {
    Expanded = 'expanded',
    Compact = 'compact',
    Album = 'album'
}

export const LIST_STYLES = [
    ListStyle.Expanded,
    ListStyle.Compact,
    ListStyle.Album
];