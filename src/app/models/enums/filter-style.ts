import type { EnumDescription } from '../api/composites';

export enum FilterStyle {
    None = 'none',
    Invert = 'invert',
    BlueLight = 'blue-light',
    BluePrint = 'blue-print',
    Custom = 'custom'
}

export const FILTER_STYLES: EnumDescription<FilterStyle>[] = [
    {
        value: FilterStyle.None,
        name: 'Original Image',
        description: 'No filter applied'
    },
    {
        value: FilterStyle.Invert,
        name: 'Invert Colors',
        description: 'Inverts the colors of the image',
    },
    {
        value: FilterStyle.BlueLight,
        name: 'Blue Light / Night Mode',
        description: 'Applies a blue light filter for night mode',
    },
    {
        value: FilterStyle.BluePrint,
        name: 'Blue Print',
        description: 'Applies a blue print filter',
    },
    {
        value: FilterStyle.Custom,
        name: 'Custom / User Defined',
        description: 'Applies a custom user-defined filter',
    },
];
