import type { EnumDescriptions } from './base';

export enum FilterStyle {
    None = 'none',
    Invert = 'invert',
    BlueLight = 'blue-light',
    BluePrint = 'blue-print',
    Custom = 'custom'
}

export const FILTER_STYLES_ALL: EnumDescriptions<FilterStyle> = [
    {
        value: FilterStyle.None,
        display: 'Original Image',
        enabled: true,
    },
    {
        value: FilterStyle.Invert,
        display: 'Invert Colors',
        enabled: true,
    },
    {
        value: FilterStyle.BlueLight,
        display: 'Blue Light / Night Mode',
        enabled: true,
    },
    {
        value: FilterStyle.BluePrint,
        display: 'Blue Print',
        enabled: true,
    },
    {
        value: FilterStyle.Custom,
        display: 'Custom / User Defined',
        enabled: true,
    },

];

export const FILTER_STYLES = FILTER_STYLES_ALL.filter((style) => style.enabled);
