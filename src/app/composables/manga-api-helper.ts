import type { BoxedBase, BoxedArray, BoxedEmpty, BoxedError, BoxedPaged, Boxed } from '../models';

type ApiResponse<T> = BoxedError | BoxedEmpty | BoxedArray<T> | BoxedPaged<T> | Boxed<T>;

export function useMangaApi() {
    const { apiUrl, token } = useSettingsHelper();
    const conf = useRuntimeConfig();
    const fetch = useSharedApi(fetchApiHelper(() => ({ apiUrl, token: token.value, prod: conf.public.prod })));
    const nuxt = useSharedApi(useApiHelper());

    function data<T>(response: BoxedError | BoxedEmpty): undefined;
    function data<T>(response: BoxedError | BoxedArray<T>): T[];
    function data<T>(response: BoxedError | BoxedPaged<T>): { data: T[]; total: number; pages: number };
    function data<T>(response: BoxedError | Boxed<T>): T;
    function data<T>(response: BoxedError | ApiResponse<T>) {
        if (!response) return undefined;
        if (response.type === 'paged') {
            return { data: response.data, total: response.total, pages: response.pages };
        }

        if ('data' in response)
            return response.data;

        return undefined;
    }

    return {
        promise: fetch,
        nuxt: nuxt,
        isSuccess: <T extends BoxedBase>(response?: T) => {
            if (!response) return false;
            const code = response.code ?? 500;
            return code >= 200 && code < 300;
        },
        errorMessage: <T extends BoxedBase>(response?: T) => {
            if (!response)
                return 'No response';

            const code = response.code ?? 500;
            if (code >= 200 && code < 300)
                return undefined;

            const errors = response.errors ?? ['Unknown error'];
            let message = '';
            if (response.description) {
                message = response.description + ". ";
            }
            message += errors.join('; ');
            return message;
        },
        data
    }
}
