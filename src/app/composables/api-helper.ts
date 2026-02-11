import type { AsyncData } from "#app";
import filesaver from 'file-saver';

export type Params = { [key: string]: any; };

export const useApiHelper = () => {
    const { apiUrl, token, wrapUrl } = useSettingsHelper();

    const headers = () => {
        const t = token.value;
        if (!t) return undefined;
        return { 'Authorization': `Bearer ${t}` };
    };
    const clone = <T>(item: T) => <T>JSON.parse(JSON.stringify(item));

    function get<T>(url: string, params?: Params, lazy: boolean = false) {
        const opts = <any>{
            params,
            headers: headers()
        };

        if (lazy)
            return useLazyFetch<T>(wrapUrl(apiUrl, url), opts);

        return useFetch<T>(wrapUrl(apiUrl, url), opts);
    }

    function post<T>(url: string, body?: any, params?: Params, lazy: boolean = false) {
        const opts = <any>{
            params,
            headers: headers(),
            body,
            method: 'post'
        };

        if (lazy)
            return useLazyFetch<T>(wrapUrl(apiUrl, url), opts);

        return useFetch<T>(wrapUrl(apiUrl, url), opts);
    }

    function put<T>(url: string, body?: any, params?: Params, lazy: boolean = false) {
        const opts = <any>{
            params,
            headers: headers(),
            body,
            method: 'PUT'
        };

        if (lazy)
            return useLazyFetch<T>(wrapUrl(apiUrl, url), opts);

        return useFetch<T>(wrapUrl(apiUrl, url), opts);
    }

    function deletefn<T>(url: string, params?: Params, lazy: boolean = false) {
        const opts = <any>{
            params,
            headers: headers(),
            method: 'DELETE'
        };

        if (lazy)
            return useLazyFetch<T>(wrapUrl(apiUrl, url), opts);

        return useFetch<T>(wrapUrl(apiUrl, url), opts);
    }

    async function download(uri: string, name?: string, req?: RequestInit) {
        try {
            if (token.value) {
                const headers = {
                    'Authorization': `Bearer ${token.value}`
                }
                req ??= {
                    headers
                }
            }

            const response = await fetch(uri, req);
            const fileData = await response.blob();
            filesaver.saveAs(fileData, name);
        } catch (error) {
            console.error(`Failed to download ${uri}`, {
                error,
                uri,
                name,
                req
            });
            window.open(uri, '_blank')?.focus();
        }
    }

    function onFinish<T>(request: AsyncData<T, any>, fn: (item?: T) => void, err?: (item: any) => void) {
        const { pending, data, error } = request;

        const resolve = () => {
            if (pending.value) return;

            if (error.value && err) {
                err(error);
                return;
            }

            fn(data.value ?? undefined);
        }

        resolve();

        watch(() => pending.value, () => resolve());
    }

    function toPromise<T>(request: AsyncData<T, any>, noError: boolean = false): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            onFinish(request, (d) => resolve(d), (err) => noError ? resolve(undefined) : reject(err));
        });
    }

    const debounce = <T>(fun: (arg: T) => void, wait: number) => {
        let timer : any;
        return (arg: T) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fun(arg);
            }, wait);
        }
    }

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
                    return `${-Math.round(elapsed / units[u])} ${u + (-Math.round(elapsed / units[u]) > 1 ? "s" : "")
                        } ago`;
                }
            }
        }
        return "A long time ago";
    }

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

    return {
        get,
        post,
        postFile: <T>(url: string, file: File, param?: Params) => {
            const data = new FormData();
            data.append('file', file);
            return post<T>(url, file, param);
        },
        put,
        del: deletefn,
        download,
        onFinish,
        toPromise,
        clone,
        debounce,
        throttle,
        dateFormatLocal,
        dateFormatMicro,
        wrapUrl
    }
}
