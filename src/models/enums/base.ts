export type EnumDescription<T> = {
    value: T;
    display: string;
    enabled: boolean;
};

export type EnumDescriptions<T> = EnumDescription<T>[];
