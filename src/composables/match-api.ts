import { MatchMethodResult, MatchMethods } from "~/models";

export const useMatchApi = () => {
    const { get } = useApiHelper();
    
    const baseUrl = 'https://match.index-0.com';

    const url = (url: MatchMethods) => `${baseUrl}/${url}`;
    
    const count = () => get<MatchMethodResult<number>>(url('count'));

    const list = (offset: number = 0, limit: number = 100) => get<MatchMethodResult<string>>(url(`list`), { limit, offset });

    const ping = () => get<MatchMethodResult<void>>(url('ping'));

    return { count, list, ping };
}