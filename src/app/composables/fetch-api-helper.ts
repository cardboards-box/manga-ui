import type { CacheResolver, ApiResult, BoxedBase, BoxedEmpty } from "../models";

export type FetchApiHandle = ReturnType<typeof fetchApiHelper>;

export function fetchApiHelper(cache: CacheResolver) {
    const { wrapUrl } = useSettingsHelper();

    const headers = (body?: any) => {

        const h: Record<string, string> = {
            'Accept': 'application/json',
        };

        if (!(body instanceof FormData)) {
            h['Content-Type'] = 'application/json';
        }

        const token = cache()?.token;
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }

    const doReq = async <T extends BoxedBase = BoxedEmpty>(
        url: string,
        param: Params | undefined,
        method: string,
        opts?: RequestInit
    ): Promise<ApiResult<T>> => {
        try {
            const result = await fetch(wrapUrl(cache()?.apiUrl, url, param), {
                method: method,
                headers: headers(opts?.body),
                ...opts
            });

            if (!result.ok) {
                return await result.json() as ApiResult<T>;
            }

            return await result.json() as ApiResult<T>;
        } catch (ex) {
            console.error('Error occurred while fetching API:', {
                url,
                param,
                method,
                error: ex
            });
            return {
                type: 'error',
                code: 500,
                description: ex?.toString() || 'Internal Server Error',
                errors: [ex?.toString() || 'Internal Server Error'],
                elapsed: 0,
                requestId: 'client-error',
            };
        }
    }

    const get = <T extends BoxedBase = BoxedEmpty>(url: string, param?: Params) => doReq<T>(url, param, 'GET');
    const post = <T extends BoxedBase = BoxedEmpty>(url: string, body?: any, param?: Params) => doReq<T>(url, param, 'POST', { body: JSON.stringify(body) });
    const put = <T extends BoxedBase = BoxedEmpty>(url: string, body?: any, param?: Params) => doReq<T>(url, param, 'PUT', { body: JSON.stringify(body) });
    const del = <T extends BoxedBase = BoxedEmpty>(url: string, body?: any, param?: Params) => doReq<T>(url, param, 'DELETE', { body: JSON.stringify(body) });
    const postFile = <T extends BoxedBase = BoxedEmpty>(url: string, file: File, param?: Params) => {
        const formData = new FormData();
        formData.append('file', file);
        return doReq<T>(url, param, 'POST', { body: formData });
    }

    return { get, post, put, del, postFile, wrapUrl }
}
