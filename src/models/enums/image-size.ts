import type { EnumDescriptions } from './base';

export enum ImageSize {
    Fit = 'fit',
    FitToWidth = 'width',
    FitToHeight = 'height',
    NaturalSize = 'natural',
    CustomSize = 'custom',
    CustomMaxSize = 'custom-max',
}

export enum ImageScroll {
    None = 'none',
    Start = 'start',
    Mid = 'mid',
    End = 'end',
}

export const IMAGE_SIZES_ALL: EnumDescriptions<ImageSize> = [
    {
        value: ImageSize.Fit,
        display: 'Fit to browser size',
        enabled: true,
    },
    {
        value: ImageSize.FitToWidth,
        display: 'Fit to browser width',
        enabled: true,
    },
    {
        value: ImageSize.FitToHeight,
        display: 'Fit to browser height',
        enabled: true,
    },
    {
        value: ImageSize.NaturalSize,
        display: 'Natural Image Size',
        enabled: true,
    },
    {
        value: ImageSize.CustomSize,
        display: 'Custom Image Size (Exact)',
        enabled: true,
    },
    {
        value: ImageSize.CustomMaxSize,
        display: 'Custom Image Size (Max)',
        enabled: true,
    }
];

export const IMAGE_SIZES = IMAGE_SIZES_ALL.filter(t => t.enabled);
