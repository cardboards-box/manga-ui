export const useSettingsHelper = () => {
    const config = useRuntimeConfig();

    function getStore<T>(key: string, def?: T) {
        if (!process.client) return def;
        return <T><any>localStorage.getItem(key) ?? def;
    }

    function setStore<T>(key: string, value?: T) {
        if (!process.client) return;
        if (value) localStorage.setItem(key, (<any>value).toString());
        else localStorage.removeItem(key);
    }

    function getSet<T>(key: string, def?: T, fn?: (val: T | undefined) => void) {
        const fetch = () => getStore<T>(key, def);
        const state = useState<T | undefined>(key, () => fetch());

        return computed({
            get: () => state.value ?? fetch(),
            set: (val: T | undefined) => {
                state.value = val;
                setStore(key, val);
                if (fn) fn(val);
            }
        });
    }

    function getSetJson<T>(key: string, def?: string, fn?: (val: T | undefined) => void) {
        const fromJson = () => getStore<string>(key);
        const toJson = (val: T | undefined) => {
            if (!val) return undefined;
            return JSON.stringify(val);
        }
        const state = useState<string | undefined>(key, () => fromJson());

        return computed({
            get: () => {
                const value = state.value ?? fromJson();
                if (!value) return undefined;

                return <T>JSON.parse(value);
            },
            set: (val: T | undefined) => {
                setStore(key, state.value = toJson(val));
                if (fn) fn(val);
            }
        });
    }

    const getSetBool = (key: string, def: boolean, fn?: (val: boolean) => void) => {
        const fetch = () => {
            const value = getStore(key);
            if (value === undefined) return undefined;

            return !!value;
        };
        const state = useState<boolean | undefined>(key, () => fetch());
        return computed({
            get: () => state.value ?? fetch() ?? def,
            set: (value: boolean) => {
                state.value = value;
                setStore(key, value ? '1' : undefined);
                if (fn) fn(value);
            }
        });
    };

    const getSetNumb = (key: string, def: number, fn?: (val: number) => void) => {
        const fetch = () => {
            const value = getStore(key);
            if (value === undefined || value === null) return undefined;
            return +value;
        }

        const state = useState<number | undefined>(key,  () => fetch());
        return computed({
            get: () => state.value ?? fetch() ?? def,
            set: (value: number) => {
                state.value = value;
                setStore(key, value.toString());
                if (fn) fn(value);
            }
        })
    };

    const getSetNumbNull = (key: string, def: number | undefined, fn?: (val: number | undefined) => void) => {
        const fetch = () => {
            const value = getStore(key);
            if (value === undefined || value === null) return undefined;
            return +value;
        }

        const state = useState<number | undefined>(key,  () => fetch());
        return computed({
            get: () => state.value ?? fetch() ?? def,
            set: (value: number | undefined) => {
                state.value = value;
                setStore(key, value?.toString());
                if (fn) fn(value);
            }
        })
    }

    const getSetArray = (key: string, def: string[], fn?: (val: string[]) => void) => {
        const fetch = () => getStore<string>(key)
            ?.toString()
            ?.split(',')
            ?.map(t => t.trim());
        const state = useState<string[] | undefined>(key, () => fetch());

        return computed({
            get: () => state.value ?? fetch() ?? def,
            set: (value: string[]) => {
                state.value = value;
                setStore(key, value.join(', ').toString());
                if (fn) fn(value);
            }
        })
    }

    const getSetDate = (key: string, def?: Date | null, fn?: (val: Date  | null | undefined) => void) => {
        const fetch = () => {
            const value = getStore<string>(key);
            if (!value) return undefined;
            return new Date(value);
        }

        const state = useState<Date | undefined | null>(key, () => fetch());
        return computed({
            get: () => state.value ?? fetch() ?? def,
            set: (value: Date | undefined | null) => {
                state.value = value;
                const v = value ? new Date(value).toISOString() : value;
                setStore(key, v);
                if (fn) fn(value);
            }
        });
    }

    return {
        token: getSet<string>('auth-token'),
        redirect: getSet<string>('redirect-url'),
        menuOpen: getSetBool('manga-menu-open', false),

        apiUrl: config.public.apiUrl,
        authUrl: config.public.authUrl,
        appId: config.public.appId,
        proxyUrl: config.public.proxyUrl,

        getSetBool,
        getSet,
        getSetNumb,
        getSetNumbNull,
        getSetArray,
        getSetJson,
        getSetDate,
    };
}
