import type { EnumDescriptions } from './base';

export enum ProgressBarStyle {
    None = 'none',
    Bottom = 'bottom',
    Left = 'left',
    Right = 'right'
}

export const PROGRESS_BAR_STYLES_ALL: EnumDescriptions<ProgressBarStyle> = [
    {
        value: ProgressBarStyle.None,
        display: 'None',
        enabled: true,
    },
    {
        value: ProgressBarStyle.Bottom,
        display: 'Bottom',
        enabled: true,
    },
    {
        value: ProgressBarStyle.Left,
        display: 'Left',
        enabled: true,
    },
    {
        value: ProgressBarStyle.Right,
        display: 'Right',
        enabled: true,
    },
];

export const PROGRESS_BAR_STYLES = PROGRESS_BAR_STYLES_ALL.filter((style) => style.enabled);
