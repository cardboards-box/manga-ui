export type booleanish = boolean | 'true' | 'false' | '';
export type booleanishext = booleanish | '';
export type Dictionary<T> = { [key: string]: T };
export type KeyedDictionary<TKey extends string | number | symbol, TValue> = { [key in TKey]: TValue };
export type OKD<TKey extends string | number | symbol, TValue> = { [key in TKey]?: TValue };

export type ClassOptions = string | string[] | undefined | null | {
    [key: string]: booleanishext;
}

export type StyleOptions = string | string[] | undefined | null | {
    [key: string]: string | undefined | null;
}

export type Regions = 'top' | 'left' | 'bottom' | 'right' | 'center';

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    name: Regions;
}
