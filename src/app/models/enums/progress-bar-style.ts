import type { EnumDescription } from '../api/composites';

export enum ProgressBarStyle {
    None = 'none',
    Top = 'top',
    Bottom = 'bottom',
    Left = 'left',
    Right = 'right'
}

export const PROGRESS_BAR_STYLES: EnumDescription<ProgressBarStyle>[] = [
    {
        value: ProgressBarStyle.None,
        name: 'None',
        description: 'No progress bar',
    },
    {
        value: ProgressBarStyle.Top,
        name: 'Top',
        description: 'Progress bar at the top',
    },
    {
        value: ProgressBarStyle.Bottom,
        name: 'Bottom',
        description: 'Progress bar at the bottom',
    },
    {
        value: ProgressBarStyle.Left,
        name: 'Left',
        description: 'Progress bar on the left',
    },
    {
        value: ProgressBarStyle.Right,
        name: 'Right',
        description: 'Progress bar on the right',
    },
];
