import type { MbProfile } from '../models';


export function useAuthHelper() {
    const api = useMangaApi();
    const { token } = useSettingsHelper();
    const { currentRoute } = useRouter();

    const isClient = import.meta.client;

    const currentUser = useState<MbProfile | undefined>('login-user');
    const failureReason = useState<string | undefined>('login-failure');
    const loginReturnUrl = computed({
        get: () => isClient ? localStorage.getItem('login-return-url') ?? '/account' : '/account',
        set: (value: string) => isClient ? localStorage.setItem('login-return-url', value) : undefined
    });

    const me = () => api.promise.auth.me();
    const resCode = (code: string) => api.promise.auth.resolve(code);

    const bump = async () => {
        if (!isClient) {
            failureReason.value = 'Login is only client side.';
            return false;
        }
        if (currentUser.value) return true;
        if (!token.value) {
            currentUser.value = undefined;
            failureReason.value = 'User is not logged in.';
            return false;
        }

        const result = await me();
        currentUser.value = api.data(result);
        failureReason.value = api.errorMessage(result);
        return api.isSuccess(result);
    };

    const resolve = async (code?: string) => {
        if (!code) {
            failureReason.value = 'No login code provided.';
            return false;
        }

        if (!isClient) {
            failureReason.value = 'Login is only client side.';
            return false;
        }

        token.value = undefined;
        currentUser.value = undefined;
        failureReason.value = undefined;

        const result = await resCode(code);
        if (!api.isSuccess(result)) {
            token.value = undefined;
            currentUser.value = undefined;
            failureReason.value = api.errorMessage(result);
            console.error('Failed to resolve login code: ', result);
            return false;
        }

        const res = api.data(result);
        token.value = res.token;
        currentUser.value = res.profile;
        failureReason.value = undefined;
        return !!currentUser.value;
    }

    const login = () => {
        currentUser.value = undefined;
        failureReason.value = undefined;
        loginReturnUrl.value = currentRoute.value.fullPath;
        window.location.href = api.promise.auth.loginUrl();
    }

    const logout = () => {
        token.value = undefined;
        currentUser.value = undefined;
        failureReason.value = undefined;
    }

    const isAdmin = computed(() => currentUser.value?.admin ?? false);
    const canRead = computed(() => isAdmin.value || (currentUser.value?.canRead ?? false));

    return {
        bump,
        resolve,
        login,
        logout,
        loginReturnUrl,
        currentUser,
        failureReason,
        canRead,
        isAdmin
    }
}
