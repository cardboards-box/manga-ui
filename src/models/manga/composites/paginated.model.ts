export interface Paginated<T> {
    pages: number;
    count: number;
    results: T[];
}