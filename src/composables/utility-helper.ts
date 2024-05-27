import type { ClassOptions, booleanish, booleanishext, StyleOptions } from "~/models";
import { ImageScroll } from "~/models";

export const useUtils = () => {
    const config = useRuntimeConfig();
    const refreshTrigger = useState<boolean>('ui-refresh-trigger', () => false);
    const resizeTrigger = useState<boolean>('ui-resize-trigger', () => false);

    /**
     * Stop a function from being called too often
     * @param fun The function that should be called
     * @param wait How long to wait before the function is called
     * @returns A wrapping function for the original function that is debounced
     */
    const debounce = <T>(fun: (arg: T) => void, wait: number) => {
        let timer: NodeJS.Timer;
        return (arg: T) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fun(arg);
            }, wait);
        }
    }

    /**
     * Waits to execute a certain function again until a certain amount of time has passed
     * @param fun The function to be executed
     * @param wait How long to wait before the function can be called again
     * @returns A wrapping function for the original function that is throttled
     */
    const throttle = <T>(fun: (arg: T) => void, wait: number) => {
        let throttled = false;
        return (arg: T) => {
            if (throttled) return;

            fun(arg);
            throttled = true;
            setTimeout(() => {
                throttled = false;
            }, wait);
        }
    }

    /**
     * Returns the relative version of a date
     * @param inDate The date to check against
     * @param full whether or not to use the full format
     * @returns The relative version of the date
     */
    const dateFormatLocal = (inDate: string, full = false): string => {
        const date = Date.parse(inDate);
        const units = {
            year: 24 * 60 * 60 * 1000 * 365,
            month: (24 * 60 * 60 * 1000 * 365) / 12,
            day: 24 * 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            minute: 60 * 1000,
            second: 1000,
        };
        const elapsed = date - Date.now();
        for (const key in units) {
            const u = key as keyof typeof units;
            if (Math.abs(elapsed) > units[u] || u == "second") {
                try {
                    // @ts-ignore
                    const rtf = new Intl.RelativeTimeFormat("en", {
                        numeric: "auto",
                        style: !full ? "narrow" : undefined,
                    });
                    return rtf.format(Math.round(elapsed / units[u]), u);
                } catch (error) {
                    console.warn(error);
                    return `${-Math.round(elapsed / units[u])} ${u + (-Math.round(elapsed / units[u]) > 1 ? "s" : "")} ago`;
                }
            }
        }
        return "A long time ago";
    }

    /**
     * Returns a short version of the date
     * @param inDate The date to check against
     * @returns The shortened version of the date
     */
    const dateFormatMicro = (inDate: string): string => {
        const date = Date.parse(inDate);
        const units = {
            y: 24 * 60 * 60 * 1000 * 365,
            mo: (24 * 60 * 60 * 1000 * 365) / 12,
            d: 24 * 60 * 60 * 1000,
            h: 60 * 60 * 1000,
            m: 60 * 1000,
            s: 1000,
        };
        const elapsed = date - Date.now();
        for (const key in units) {
            const u = key as keyof typeof units;
            if (Math.abs(elapsed) > units[u] || u == "s") {
                return `${-Math.round(elapsed / units[u])}${u}`;
            }
        }
        return "∞";
    }

    /**
     * Converts the given byte count to a human readable format
     * @param size The byte count to convert
     * @returns The converted byte count
     */
    const fileSizeMicro = (size: number) => {
        const units = {
            gb: 1024 * 1024 * 1024,
            mb: 1024 * 1024,
            kb: 1024,
            b: 1,
        }

        for (const key in units) {
            const u = key as keyof typeof units;
            if (size > units[u] || u == "b") {
                return `${(size / units[u]).toFixed(2)}${u}`;
            }
        }
        return "∞";
    }

    /**
     * Clones the given object
     * @param val The object to clone
     * @returns The cloned value
     */
    const clone = <T>(val: T) => {
        if (val === undefined) return undefined;
        return <T>JSON.parse(JSON.stringify(val));
    }

    /**
     * Bitwise ORs all the given inputs together
     * @param inputs The inputs to OR together
     * @returns The ORed value
     */
    const shiftFlag = (inputs: number[]) => {
        let output = 0;

        for (let inp of inputs) {
            output = output | inp;
        }

        return output;
    };

    /**
     * Checks if the given input has the given flag
     * @param input The input to check
     * @param flag The flag to check for
     * @returns Whether or not the flag is present
     */
    const hasFlag = (input: number, flag: number) => (input & flag) !== 0;

    /**
     * Creates an array of all of the values that are present in the input
     * @param input The input to check
     * @param options The available flags
     * @returns The array of flags that are present
     */
    const unshiftFlag = (input: number, options: number[]) => {
        let output = [];

        for (let opt of options) {
            if (hasFlag(input, opt)) output.push(opt);
        }

        return output;
    }

    /**
     * Gets the current max width of the page from various document properties
     * @returns The current max width of the page
     */
    const getWidth = () => {
        return Math.max(
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.offsetWidth,
            document.documentElement.clientWidth
        );
    };

    /**
     * Checks if the current page size is under the given max width
     * @param maxWidth The max width to check against (defaults to 1050px)
     * @returns Whether or not the page is under the given max width
     */
    const isUnderMaxWidth = (maxWidth: number = 1050) => getWidth() <= maxWidth;

    /**
     * Gets all of the keys of the current object with the correct type (stupid typescript)
     * @param obj The object to get the keys from
     * @returns The keys of the object
     */
    const keys = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];

    /**
     * Sets the title of the current page with consideration for the route
     * @param title The title to set the page to
     */
    const setTitle = (title: string) => {
        useSeoMeta({ title: `${title} | MangaBox`})
    }

    /**
     * Whether or not the given URL is external or something on the current site
     * @param url The url to check against
     * @returns Whether or not the URL is external
     */
    const isExternal = (url?: string) => !!url && url.toLowerCase().startsWith('http');

    /**
     * Requests a lock from the browser to prevent the browser from backgrounding the tab (helps keep websockets alive)
     * @param lockName The name of the lock to request
     * @param shared Whether or not the lock should be shared with other tabs
     * @returns A function that removes the lock
     */
    const requestLock = (
        lockName: string = 'rmm_persistence_lock',
        shared: boolean = true
    ) => {
        type Resolver = () => void;

        if (!navigator ||
            !navigator.locks ||
            !navigator.locks.request) return () => {};

        let resolver: Resolver = () => {};

        const promise = new Promise((resolve) => {
            resolver = () => resolve(undefined);
        });

        navigator.locks.request(
            lockName,
            { mode: shared ? 'shared' : 'exclusive' },
            () => {
                return promise;
            });

        return resolver;
    }

    /**
     * A polyfill for generating UUIDs
     * @returns The UUID that has been generated
     */
    const uuid = () => {
        try {
            return crypto.randomUUID();
        } catch  {
            return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
                (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
            );
        }
    }

    /**
     * Gets all of the unique values from the given array based on the given predicate
     * @param arr The array to get the unique values from
     * @param pred The predicate to use to determine uniqueness
     * @returns The unique values from the array
     */
    const unique = <T>(arr: T[], pred: (item: T) => any) => {
        return [...new Map(arr.map(item => [pred(item), item])).values()];
    }

    /**
     * Serializes the given class options into a valid class list
     * @param classes The classes to serialize to a string
     * @returns The string representation of the classes
     */
    const serClass = (classes: ClassOptions) => {
        if (classes === undefined || classes === null) return '';

        if (typeof classes === 'string') return classes;
        if (Array.isArray(classes)) return classes.join(' ');

        return Object.keys(classes)
            .filter(key => classes[key])
            .join(' ');
    }

    /**
     * Serializes all of the class options into a valid class list
     * @param classes All of the classes to serialize
     * @returns The string representation of the classes
     */
    const serClasses = (...classes: ClassOptions[]): string => {
        return classes.map(serClass).join(' ');
    }

    /**
     * Checks if the given booleanish value is true
     * @param value The value to check
     * @returns Whether or not the value is true
     */
    const isTrue = (value?: booleanish | booleanishext) => {
        return value === '' || !!value;
    }

    /**
     * Serializes the given style options into a valid style list
     * @param style The styles to serialize to a string
     * @returns The string representation of the styles
     */
    const serStyle = (style: StyleOptions) => {
        if (style === undefined || style === null) return '';
        if (typeof style === 'string') return style;
        if (Array.isArray(style)) return style.join('; ');

        return Object.keys(style)
            .filter(key => style[key] !== undefined && style[key] !== null)
            .map(key => `${key}: ${style[key]}`)
            .join('; ');
    };

    /**
     * Serializes all of the style options into a valid style list
     * @param styles All of the styles to serialize
     * @returns The string representation of the styles
     */
    const serStyles = (...styles: StyleOptions[]): string => {
        return styles.map(serStyle).join('; ');
    }

    /**
     * The percentage of the given scroller that has been scrolled
     * @param scroller The scroller to check against
     * @param height Whether or not to check the height or width
     * @returns The percent of the scroller that has been scrolled
     */
    const scrollPercent = (scroller: HTMLElement, height: boolean = true) => {
        if (height) {
            if (scroller.scrollHeight == scroller.clientHeight) return 100;
            return Math.floor(scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight) * 100);
        }

        if (scroller.scrollWidth == scroller.clientWidth) return 100;
        return Math.floor(scroller.scrollLeft / (scroller.scrollWidth - scroller.clientWidth) * 100);
    };

    /**
     * Write some text to the clipboard
     * @param text The text to write
     * @returns A promise that resolves when the text has been written
     */
    const writeToClipboard = (text: string) => {
        return navigator.clipboard.writeText(text);
    }

    /**
     * Gets the current base URL of the page
     * @returns The base URL of the current page
     */
    const baseUrl = () => {
        return `${window.location.protocol}//${window.location.host}`;
    }

    /**
     * Throttled scroll amounts for the given scroller
     * @param scroller The element to scroll
     * @param wait How long to wait before scrolling again
     * @param amount The amount to scroll by
     * @returns The scrollers
     */
    const scrollers = (scroller: Ref<HTMLElement | undefined>, wait: Ref<number>, amount: Ref<number>) => {
        const scroll = (up: booleanish) => {
            scroller.value?.scrollBy({
                top: up ? -amount.value : amount.value,
                behavior: 'smooth'
            });
        }
        const scrollLeft = (left: booleanish) => {
            scroller.value?.scrollBy({
                left: left ? -amount.value : amount.value,
                behavior: 'smooth'
            });
        };

        return {
            top: computed(() => throttle<void>(() => scroll(true), wait.value)),
            bottom: computed(() => throttle<void>(() => scroll(false), wait.value)),
            left: computed(() => throttle<void>(() => scrollLeft(true), wait.value)),
            right: computed(() => throttle<void>(() => scrollLeft(false), wait.value)),
        }
    }

    /**
     * Gets the scroll status of the element
     * @param el The element to check
     * @returns The width and height status of the elements
     */
    const scrollStatus = (el?: HTMLElement) => {
        if (!el) return {
            width: ImageScroll.None,
            height: ImageScroll.None,
        };

        const check = (client: number, scroll: number, type: 'vert' | 'horz') => {
            if (client >= scroll) return ImageScroll.None;

            const percent = scrollPercent(el, type === 'vert');
            if (percent <= 0) return ImageScroll.Start;
            if (percent >= 100) return ImageScroll.End;
            return ImageScroll.Mid;
        }

        const height = check(el.clientHeight, el.scrollHeight, 'vert');
        const width = check(el.clientWidth, el.scrollWidth, 'horz');

        return { width, height };
    }

    /**
     * Toggles fullscreen mode for the browser
     * @returns void
     */
    const fullscreen = () => {
        const elem = <any>document.documentElement;
        const doc = <any>document;

        const isFullScreen = ((<any>window).fullScreen) || (
                window.innerWidth == screen.width &&
                window.innerHeight == screen.height
            ) || (
                !window.screenTop &&
                !window.screenY
            );

        if (isFullScreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (doc.webkitExitFullscreen) { /* Safari */
                doc.webkitExitFullscreen();
            } else if (doc.msExitFullscreen) { /* IE11 */
                doc.msExitFullscreen();
            }
            return;
        }

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }

    /**
     * Scales the given width and height to fit within the given max width and height
     * @param width The width to scale
     * @param height The height to scale
     * @param maxWidth The max width to fit within
     * @param maxHeight The max height to fit within
     * @returns The new width and height
     */
    const scale = (width: number, height: number, maxWidth: number, maxHeight: number) => {
        if (width === 0 || height === 0) return { width: 0, height: 0 };

        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;

        const ratio = Math.min(widthRatio, heightRatio);
        const newWidth = width * ratio;
        const newHeight = height * ratio;

        return { width: Math.round(newWidth), height: Math.round(newHeight) };
    }

    /**
     * Converts a CSS value to a number
     * @param cssValue the CSS value
     * @param target the element to check against
     * @returns the converted number or undefined if it couldn't be converted
     */
    const cssUnit = (cssValue: string, target?: HTMLElement) => {
        //Stolen from: https://stackoverflow.com/a/66569574
        //And then adapted to work with CSS variables
        target = target || document.body;

        cssValue = cssValue.trim();

        const supportedUnits: {
            [key: string]: (value: number) => number
        } = {

            // Absolute sizes
            'px': (value: number) => value,
            'cm': (value: number) => value * 38,
            'mm': (value: number) => value * 3.8,
            'q': (value: number) => value * 0.95,
            'in': (value: number) => value * 96,
            'pc': (value: number) => value * 16,
            'pt': (value: number) => value * 1.333333,

            // Relative sizes
            'rem': (value: number) => value * parseFloat( getComputedStyle( document.documentElement ).fontSize ),
            'em': (value: number) => value * parseFloat( getComputedStyle( target ).fontSize ),
            'vw': (value: number) => value / 100 * window.innerWidth,
            'vh': (value: number) => value / 100 * window.innerHeight,

            // Times
            'ms': (value: number) => value,
            's': (value: number) => value * 1000,

            // Angles
            'deg': (value: number) => value,
            'rad': (value: number) => value * ( 180 / Math.PI ),
            'grad': (value: number) => value * ( 180 / 200 ),
            'turn': (value: number) => value * 360

        };

        // Match positive and negative numbers including decimals with following unit
        const pattern = new RegExp( `^([\-\+]?(?:\\d+(?:\\.\\d+)?))(${ Object.keys( supportedUnits ).join( '|' ) })$`, 'i' );

        // Pattern matches a CSS variable
        const varPattern = new RegExp(`var\\(--([a-zA-Z0-9-]+)\\)`, 'i');

        let matches;
        while(matches = cssValue.match(varPattern)) {
            const varName = matches[1];
            const varValue = getComputedStyle(target).getPropertyValue(`--${varName}`);
            cssValue = cssValue.replace(`var(--${varName})`, varValue);
        }

        // If is a match, return example: [ "-2.75rem", "-2.75", "rem" ]
        matches = cssValue.match( pattern );

        if ( matches ) {
            const value = Number( matches[ 1 ] );
            const unit = matches[ 2 ].toLocaleLowerCase();

            // Sanity check, make sure unit conversion function exists
            if ( unit in supportedUnits ) {
                return supportedUnits[ unit ]( value );
            }
        }

        return undefined;
    }

    /**
     * Print out the message only if we are in debug mode
     * @param message The message to print
     * @param args Any arguments to print
     */
    const debug = (message: string, ...args: any[]) => {
        if (config.public.prod) return;
        console.log(message, ...args);
    };

    (() => {
        const doResize = () => {
            if (window && 'resize-watcher' in window) return;

            window.addEventListener('resize', () => {
                resizeTrigger.value = !resizeTrigger.value;
            });
            (<any>window)['resize-watcher'] = true;
        };

        const doRefresh = () => {
            if (window && 'refresh-watcher' in window) return;

            (<any>window).rmmWatcherTimer = setInterval(async () => {
                refreshTrigger.value = !refreshTrigger.value;
            }, 1000);
        }

        if (!process.client) return;

        doResize();
        doRefresh();
    })();

    return {
        refreshTrigger,
        resizeTrigger,

        debounce,
        throttle,
        dateFormatLocal,
        dateFormatMicro,
        clone,
        shiftFlag,
        unshiftFlag,
        hasFlag,
        getWidth,
        isUnderMaxWidth,
        isExternal,
        keys,
        setTitle,
        requestLock,
        uuid,
        unique,
        serClasses,
        serStyles,
        isTrue,
        fileSizeMicro,
        scrollPercent,
        scrollStatus,
        fullscreen,
        scrollers,
        scale,
        cssUnit,
        debug,
        writeToClipboard,
        baseUrl,
    }
}
