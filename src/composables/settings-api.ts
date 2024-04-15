import type { WritableComputedRef } from "nuxt/dist/app/compat/capi";
import type { ThemeColor, SiteBackground,  } from "~/models";
import { FilterStyle, ListStyle, PageStyle, ProgressBarStyle, ImageSize, THEME_DEFAULTS } from '~/models';

type Dic = { [key: string]: string };
interface MangaSettings {
    invertControls: boolean;
    forwardOnly: boolean;
    brightness: number;
    scrollAmount: number;
    pageStyle: PageStyle;
    imageSize: ImageSize;
    filterStyle: FilterStyle;
    progressBarStyle: ProgressBarStyle;
    customFilter?: string;
    listStyle: ListStyle;
    blurPornCovers: boolean;
    showTutorial: boolean;
    showPorn: boolean;
    pageMenuOver: boolean;
    regionMargin: number;
    fillPage: boolean;
    background: SiteBackground;
    lastCheck?: Date | null;
    maxImageWidth?: number;
    maxImageHeight?: number;
}

interface Settings {
    manga?: MangaSettings;
}

type MangaSettingsKey = {
    invertControls: WritableComputedRef<boolean>;
    forwardOnly: WritableComputedRef<boolean>;
    brightness: WritableComputedRef<number>;
    scrollAmount: WritableComputedRef<number>;
    pageStyle: WritableComputedRef<PageStyle>;
    imageSize: WritableComputedRef<ImageSize>;
    filterStyle: WritableComputedRef<FilterStyle>;
    progressBarStyle: WritableComputedRef<ProgressBarStyle>;
    customFilter: WritableComputedRef<string | undefined>;
    listStyle: WritableComputedRef<ListStyle>;
    blurPornCovers: WritableComputedRef<boolean>;
    showTutorial: WritableComputedRef<boolean>;
    showPorn: WritableComputedRef<boolean>;
    pageMenuOver: WritableComputedRef<boolean>;
    regionMargin: WritableComputedRef<number>;
    fillPage: WritableComputedRef<boolean>;
    background: WritableComputedRef<SiteBackground>;
    lastCheck: WritableComputedRef<Date | undefined | null>;
    maxImageWidth?: WritableComputedRef<number | undefined | null>;
    maxImageHeight?: WritableComputedRef<number | undefined | null>;
};

const DEFAULTS: MangaSettings = {
    invertControls: false,
    forwardOnly: false,
    brightness: 70,
    scrollAmount: 100,
    pageStyle: PageStyle.Single,
    imageSize: ImageSize.Fit,
    filterStyle: FilterStyle.BlueLight,
    progressBarStyle: ProgressBarStyle.Left,
    customFilter: undefined,
    listStyle: ListStyle.Expanded,
    blurPornCovers: true,
    showTutorial: true,
    showPorn: true,
    pageMenuOver: false,
    regionMargin: 30,
    fillPage: false,
    background: { ...THEME_DEFAULTS.themes[0] },
    lastCheck: new Date(),
    maxImageHeight: undefined,
    maxImageWidth: undefined
}

export const useAppSettings = () => {
    const { currentUser } = useAuthApi();
    const { post, debounce, clone } = useApiHelper();
    const { getSetBool, getSetNumb, getSetNumbNull, getSet, getSetDate, getSetJson } = useSettingsHelper();
    const pauseUpdates = useState<boolean>(() => false);

    const settings = (() => {
        return <MangaSettingsKey>{
            invertControls: getSetBool('invert-controls', DEFAULTS.invertControls, () => commit()),
            forwardOnly: getSetBool('manga-forward-only', DEFAULTS.forwardOnly, () => commit()),
            brightness: getSetNumb('manga-brightness', DEFAULTS.brightness, () => commit()),
            scrollAmount: getSetNumb('scroll-amount', DEFAULTS.scrollAmount, () => commit()),
            pageStyle: getSet<PageStyle>('manga-page-size', DEFAULTS.pageStyle, () => commit()),
            imageSize: getSet<ImageSize>('manga-image-size', DEFAULTS.imageSize, () => commit()),
            filterStyle: getSet<FilterStyle>('image-filter', DEFAULTS.filterStyle, () => commit()),
            progressBarStyle: getSet<ProgressBarStyle>('progress-bar', DEFAULTS.progressBarStyle, () => commit()),
            customFilter: getSet<string>('custom-filter', DEFAULTS.customFilter, () => commit()),
            listStyle: getSet<ListStyle>('list-style', DEFAULTS.listStyle, () => commit()),
            blurPornCovers: getSetBool('blur-porn-covers', DEFAULTS.blurPornCovers, () => commit()),
            showTutorial: getSetBool('show-read-tutorial', DEFAULTS.showTutorial, () => commit()),
            showPorn: getSetBool('show-porn', DEFAULTS.showPorn, () => commit()),
            pageMenuOver: getSetBool('page-menu-over', DEFAULTS.pageMenuOver, () => commit()),
            regionMargin: getSetNumb('region-margin', DEFAULTS.regionMargin, () => commit()),
            fillPage: getSetBool('fill-page', DEFAULTS.fillPage, () => commit()),
            background: getSetJson<SiteBackground>('background', JSON.stringify(DEFAULTS.background), () => commitFix()),
            lastCheck: getSetDate('last-check', null, () => commit()),
            maxImageWidth: getSetNumbNull('max-image-width', undefined, () => commit()),
            maxImageHeight: getSetNumbNull('max-image-height', undefined, () => commit())
        }
    })();

    const setVar = (name: string, value?: string) => document.documentElement.style.setProperty('--' + name, value ?? '');

    const determineStyle = (theme: SiteBackground): { [key: string]: string } => {
        let map: Dic = {};
        const fallbackCustom = (value: string, custom?: string) => (value === 'custom' ? custom : value) ?? '';

        if (!theme) return map;

        switch(theme.type) {
            case 'gradient':
                const dir = theme.gradient.dir === 'deg' ? `${theme.gradient.degrees}deg` : theme.gradient.dir;
                map = {
                    'bg-image': `linear-gradient(${dir}, ${theme.gradient.colors.map(t => t.color).join(', ')})`,
                    'bg-image-position': 'center',
                    'bg-image-repeat': 'no-repeat',
                    'bg-image-size': 'cover',
                    'bg-image-filter': ''
                };
                break;
            case 'image':
                map = {
                    'bg-image': `url(${theme.image.url})`,
                    'bg-image-position': fallbackCustom(theme.image.position, theme.image.custonPosition),
                    'bg-image-repeat': theme.image.repeat,
                    'bg-image-size': fallbackCustom(theme.image.size, theme.image.customSize),
                    'bg-image-filter': theme.image.filters.map(t => `${t.key}(${t.value})`).join(' ')
                };
                break;
            case 'solid-color':
                map = {
                    'bg-image': `linear-gradient(0deg, ${theme.solidColor}, ${theme.solidColor})`,
                    'bg-image-position': 'center',
                    'bg-image-repeat': 'no-repeat',
                    'bg-image-size': 'cover',
                    'bg-image-filter': ''
                };
                break;
        }

        for(const key in theme.colorMods) {
            if (theme.colorMods[<ThemeColor>key])
                map[key] = theme.colorMods[<ThemeColor>key] ?? '';
        }

        return map;
    };

    const setBgImage = (theme: SiteBackground) => {
        const styles = <Dic>determineStyle(theme);
        for(const key in styles) {
            setVar(key, styles[key]);
        }
    };

    const fixBgImage = () => {
        if (!process.client) return;

        setBgImage(settings.background.value);
    };

    const settingsFromUser = () => {
        if (!currentUser.value) return undefined;
        return <Settings>JSON.parse(currentUser.value.settings || '{}') ?? undefined;
    }

    const rawSettings = () => {
        const instance = <any>clone(DEFAULTS);
        Object.keys(instance)
            .forEach(t => instance[t] = (<any>settings)[t].value);
        return <MangaSettings>instance;
    }

    const commitDebounce = debounce<void>(() => {
        if (!currentUser.value || pauseUpdates.value) return;
        const current = settingsFromUser() ?? { manga: clone(DEFAULTS) };
        current.manga = rawSettings();
        const newSet = JSON.stringify(current);
        return post(`auth/settings`, { settings: newSet });
    }, 1000);

    const commit = () => commitDebounce();
    const commitFix = () => { commit(); fixBgImage();}

    const injectSettings = () => {
        const raw = <any>settingsFromUser()?.manga;
        if (!raw) return;

        pauseUpdates.value = true;
        for(const key in settings) {
            const val = raw[key];
            if (val === undefined) continue;

            (<any>settings)[key].value = val;
        }

        fixBgImage();

        pauseUpdates.value = false;
    }

    const resetBgImage = () => {
        settings.background.value = clone(THEME_DEFAULTS.themes[0]);
        fixBgImage();
    }

    return {
        ...settings,
        pauseUpdates,

        injectSettings,
        resetBgImage,
        fixBgImage,
        commit,
        determineStyle,
        setBgImage
    }
};
