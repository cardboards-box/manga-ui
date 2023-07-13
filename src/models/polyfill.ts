
export type booleanish = boolean | 'true' | 'false';
export type booleanishext = booleanish | '';

export const isTrue = (value?: booleanish | booleanishext) => {
    return value === '' || !!value;
} 