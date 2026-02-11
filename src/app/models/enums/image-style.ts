import type { EnumDescription } from '../api/composites';

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

export const IMAGE_SIZES: EnumDescription<ImageSize>[] = [
    {
        value: ImageSize.Fit,
        name: 'Fit to browser size',
        description: 'Fits the image to the browser\'s width and height'
    },
    {
        value: ImageSize.FitToWidth,
        name: 'Fit to browser width',
        description: 'Fits the image to the browser\'s width'
    },
    {
        value: ImageSize.FitToHeight,
        name: 'Fit to browser height',
        description: 'Fits the image to the browser\'s height'
    },
    {
        value: ImageSize.NaturalSize,
        name: 'Natural Image Size',
        description: 'Displays the image at its natural size',
    },
    {
        value: ImageSize.CustomSize,
        name: 'Custom Image Size (Exact)',
        description: 'Displays the image at a custom exact size',
    },
    {
        value: ImageSize.CustomMaxSize,
        name: 'Custom Image Size (Max)',
        description: 'Displays the image at a custom maximum size',
    }
];
