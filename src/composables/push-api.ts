import type { Push } from '~/models';

export const usePushApi = () => {
    const { get, del, post } = useApiHelper();

    const fetch = (id: number) => get<Push>(`push/${id}`);
    const fetchAll = () => get<Push[]>(`push`);
    const create = (push: Push) => post<Push>(`push`, push);
    const remove = (id: number) => del(`push/${id}`);

    return {
        fetch,
        fetchAll,
        create,
        remove,
    }
};
