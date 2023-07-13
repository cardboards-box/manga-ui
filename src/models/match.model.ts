export type MatchMethods = 'count' | 'ping' | 'list';

export interface MatchMethodResult<T> {
    status: 'ok' | 'fail';
    error: string[];
    method: MatchMethods | '';
    result: T[];
}