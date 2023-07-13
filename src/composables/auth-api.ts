import { AuthResponse, AuthUser } from "~/models";
import { useApiHelper } from "./api-helpers";
import { useSettingsHelper } from "./settings-helper";

export const useAuthApi = () => {
    const { get } = useApiHelper();
    const { authUrl, appId, token, getSet } = useSettingsHelper();
    const { currentRoute } = useRouter();

    const currentUser = useState<AuthUser | undefined>('login-user', () => undefined);
    const failureReason = useState<string | undefined>('login-failure', () => undefined);
    const loginReturnUrl = computed({
        get: () => process.client ? localStorage.getItem('login-return-url') ?? '/account' : '/account',
        set: (value: string) => process.client ? localStorage.setItem('login-return-url', value) : undefined
    });

    const me = () => get<AuthUser>(`auth`);
    const resCode = (code: string) => get<AuthResponse>(`auth/${code}`);

    const bump = async () => {
        if (!process.client) {
            failureReason.value = 'Login is only client side.';
            return false;
        }
        if (currentUser.value) return true;
        if (!token.value) {
            currentUser.value = undefined;
            failureReason.value = 'User is not logged in.';
            return false;
        }

        const { data: user, error } = await me();
        if (error.value || !user.value) {
            currentUser.value = undefined;
            failureReason.value = 'Couldn\'t fetch user profile.';
            return false;
        }

        currentUser.value = {...user.value};
        failureReason.value = undefined;
        return true;
    };

    const resolve = async (code?: string) => {
        if (!code) {
            failureReason.value = 'Invalid login code.';
            return false;
        }

        if (!process.client) {
            failureReason.value = 'Login is only client side.';
            return false;
        }

        failureReason.value = undefined;
        const { data: results, error } = await resCode(code);
        if (error.value || !results.value || results.value.error) {
            token.value = undefined;
            currentUser.value = undefined;
            console.error('Error occurred during login', { error: error.value, results: results.value });
            failureReason.value = 'An error occurred during login! ' + results.value?.error;
            return false;
        }

        token.value = results.value.token;
        currentUser.value = results.value.user;
        return !!currentUser.value;
    };

    const login = () => {
        currentUser.value = undefined;
        failureReason.value = undefined;
        const returnUrl = window.location.protocol + '//' + window.location.host + '/auth';
        loginReturnUrl.value = currentRoute.value.fullPath;
        window.location.href = `${authUrl}/Home/Auth/${appId}?redirect=${encodeURIComponent(returnUrl)}`;
    };

    const logout = () => {
        token.value = undefined;
        currentUser.value = undefined;
        failureReason.value = undefined;
    };

    return {
        bump,
        resolve,
        login,
        logout,
        loginReturnUrl,
        currentUser,
        failureReason
    }
};