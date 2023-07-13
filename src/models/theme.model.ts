
export type ThemeType = 'gradient' | 'image' | 'solid-color';
export type ThemeColor = 'bg-color' | 'bg-color-accent' | 'bg-color-accent-darkish' |
    'bg-color-accent-dark' | 'bg-color-offset' |
    'color' | 'color-success' | 'color-primary' |
    'color-primary-trans' | 'color-secondary' | 'color-secondary-tran' |
    'color-secondary-dark' | 'color-actual-warning' |
    'color-warning' | 'color-muted';
export type FilterProp =
    'blur' | 'brightness' | 'contrast' |
    'grayscale' | 'hue-rotate' | 'invert' |
    'opacity' | 'saturate' | 'sepia' |
    'drop-shadow' | 'url';

export type ThemeFilter = { key: FilterProp, value: string };

export type StyleMap = {
    'bg-image': string,
    'bg-image-position': string,
    'bg-image-repeat': string,
    'bg-image-size': string,
    'bg-image-filter': string
}

export interface ThemeColors {
    key: ThemeColor;
    value: string;
    desc?: string;
}

interface TypeConfig {
    key: FilterProp;
    unit: string;
    type: 'pixel' | 'percent' | 'degrees' | 'text';
    min?: number;
    max?: number;
    step?: number;
}

interface SiteBackgroundProps {
    position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'custom';
    custonPosition?: string;
    repeat: 'repeat-x' | 'repeat-y' | 'repeat' | 'no-repeat' | 'space' | 'round';
    size: 'auto' | 'cover' | 'contain' | 'custom';
    customSize?: string;
    filters: ThemeFilter[];
}

interface SiteBackgroundImage extends SiteBackgroundProps {
    url: string;
}

export interface SiteBackground {
    name: string;
    type: ThemeType;
    solidColor: string;
    gradient: {
        dir: string,
        degrees: number,
        colors: { color: string }[]
    };
    image: SiteBackgroundImage;
    colorMods: {
        [key in ThemeColor]?: string
    }
}

const DEFAULT_IMAGE_URL = 'https://static.index-0.com/image/wallpapers/03.jpg';
const DEFAULT_IMAGE_PROPS: SiteBackgroundProps = {
    position: 'center',
    repeat: 'no-repeat',
    size: 'cover',
    filters: [
        { key: 'blur', value: '2px' },
        { key: 'grayscale', value: '15%' },
        { key: 'brightness', value: '85%' }
    ]
};
const DEFAULT_IMAGE: SiteBackgroundImage = {
    url: DEFAULT_IMAGE_URL,
    ...DEFAULT_IMAGE_PROPS
}
const DEFAULT_GRADIENT: SiteBackground['gradient'] = {
    dir: 'to right bottom',
    degrees: 0,
    colors: [{ color: '#061a7d' }, { color: '#0260ed' }, { color: '#421b8f' }, { color: '#c915d5' }]
}

const PERC = { min: 0, step: 5 };
const MAX_PERC = { ...PERC, max: 100, step: 5 };
const THEMES: SiteBackground[] =[
    {
        name: 'Default',
        type: 'gradient',
        solidColor: '#061a7d',
        gradient: { ...DEFAULT_GRADIENT },
        image: { ...DEFAULT_IMAGE },
        colorMods: {}
    }, {
        name: 'Dark',
        type: 'gradient',
        solidColor: '#061a7d',
        gradient: {
            dir: 'to right bottom',
            degrees: 0,
            colors: [{ color: '#1953aa' }, { color: '#693594' }, { color: '#57195c' }, { color: '#1a10a0' }, { color: '#171130' }]
        },
        image: { ...DEFAULT_IMAGE },
        colorMods: {}

    }, {
        name: 'Light',
        type: 'gradient',
        solidColor: '#061a7d',
        gradient: {
            dir: 'to right bottom',
            degrees: 0,
            colors: [{ color: '#0260ed' }, { color: '#9645d9' }, { color: '#ce14db' }, { color: '#9f0f9a' }, { color: '#ff0040' }]
        },
        image: { ...DEFAULT_IMAGE },
        colorMods: {
            'bg-color': '#fff' 
        },
    }, {
        name: 'Open Fields',
        type: 'image',
        solidColor: '#061a7d',
        gradient: { ...DEFAULT_GRADIENT },
        image: { ...DEFAULT_IMAGE },
        colorMods: {}
    }, {
        name: 'Tired City',
        type: 'image',
        solidColor: '#061a7d',
        gradient: { ...DEFAULT_GRADIENT },
        image: {
            url: 'https://static.index-0.com/image/wallpapers/02.jpg',
            ...DEFAULT_IMAGE_PROPS
        },
        colorMods: {},
    }, {
        name: 'Beachside Castle',
        type: 'image',
        solidColor: '#061a7d',
        gradient: { ...DEFAULT_GRADIENT },
        image: {
            url: 'https://static.index-0.com/image/wallpapers/01.jpg',
            ...DEFAULT_IMAGE_PROPS
        },
        colorMods: {},
    }
];
export const THEME_DEFAULTS = {
    types: <{name: string, value: ThemeType}[]>[
        { name: 'Gradient', value: 'gradient' },
        { name: 'Image', value: 'image' },
        { name: 'Solid Color', value: 'solid-color' }
    ],
    styleMap: <{[key: string]: string}>{
        'bg-image': 'background-image',
        'bg-image-position': 'background-position',
        'bg-image-repeat': 'background-repeat',
        'bg-image-size': 'background-size',
        'bg-image-filter': 'filter'
    },
    directions: ['to right bottom', 'to right top', 'to left bottom', 'to left top', 'deg'],
    imagePositions: ['top', 'bottom', 'left', 'right', 'center', 'custom'],
    imageRepeats: ['repeat-x', 'repeat-y', 'repeat', 'no-repeat', 'space', 'round'],
    imageSizes: ['auto', 'cover', 'contain', 'custom'],
    availableTypes: <TypeConfig[]> [
        { key: 'url', unit: '', type: 'text' },
        { key: 'blur', unit: 'px', type: 'pixel', min: 0, step: 1 },
        { key: 'brightness', unit: '%', type: 'percent', ...PERC },
        { key: 'contrast', unit: '%', type: 'percent', ...PERC },
        { key: 'grayscale', unit: '%', type: 'percent', ...MAX_PERC },
        { key: 'hue-rotate', unit: 'deg', type: 'degrees', min: -360, max: 360, step: 10 },
        { key: 'invert', unit: '%', type: 'percent', ...MAX_PERC },
        { key: 'opacity', unit: '%', type: 'percent', ...MAX_PERC },
        { key: 'saturate', unit: '%', type: 'percent', ...PERC },
        { key: 'sepia', unit: '%', type: 'percent', ...MAX_PERC },
        { key: 'drop-shadow', unit: '', type: 'text' },
    ],
    themes: THEMES,
    colors: <ThemeColors[]>[
        { key: "bg-color", value: "rgba(12, 9, 12, 1)", desc: "Darkest Background Color" },
        { key: "bg-color-accent", value: "rgba(0, 0, 0, 0.25)", desc: 'The primary background color for floating elements' },
        { key: "bg-color-accent-darkish", value: "rgba(0, 0, 0, 0.45)", desc: 'Slightly darker version of the `bg-color-accent`' },
        { key: "bg-color-accent-dark", value: "rgba(0, 0, 0, 0.75)", desc: 'The background color used for fade-overs (like menus and popups)' },
        { key: "bg-color-offset", value: "#302e42", desc: 'Mostly used for borders or scroll-bars' },
        { key: "color", value: "#dcddde", desc: 'The color of almost all text on the website' },
        { key: "color-success", value: "rgb(0, 255, 0)", desc: 'The color of any success message' },
        { key: "color-primary", value: "#726ae4", desc: 'The color of any default button / message' },
        { key: "color-primary-trans", value: "rgba(196, 192, 244, 0.8)", desc: 'A transparent version of `color-primary`' },
        { key: "color-secondary", value: "rgba(0, 174, 240, 1)", desc: 'An accent color for `color-primary`' },
        { key: "color-secondary-tran", value: "rgba(0, 174, 240, 0.25)", desc: 'A transparent version of `color-secondary`' },
        { key: "color-secondary-dark", value: "rgb(0, 95, 133)", desc: 'A darker version of `color-secondary`' },
        { key: "color-actual-warning", value: "rgba(252, 83, 5, 0.705)", desc: 'The color of alert/warning text messages' },
        { key: "color-warning", value: "rgb(255, 61, 61)", desc: 'A color to direct attention to errors / warnings' },
        { key: "color-muted", value: "#555", desc: 'Represents items that cannot be interacted with or are disabled' },
    ]
}