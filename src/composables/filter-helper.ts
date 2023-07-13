import { AttributeType } from "~/models";

export const useFilterHelpter = () => {

    type Attributes = {
        type: AttributeType,
        include: boolean,
        values: string[]
    }[];
    type Primitives = string | number | boolean;
    type Options = Primitives | string[] | any;
    type Dic<T> = { [key: string]: T };

    const handleAttrsSer = (target: Dic<Primitives>, attributes: Attributes) => {
        for(let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            const key = `attr[${i}]`;
            if (attr.values.length === 0) continue;
            if (!attr.include) target[key + 'inc'] = false;
            target[key + 'val'] = attr.values.join(',');
        }
    };

    const handleAttrsDeser = (target: any, query: Dic<string | string[]>) => {
        const regex = /attr\[[0-9]\](inc|val)/;

        for(const key in query) {
            const val = query[key]?.toString();


            if (!regex.test(key) || !val) continue;

            const i = +key.substring(5, 6);
            const type = key.split('.')[1];
            if (type === 'inc') {
                target.attributes[i].include = false;
                continue;
            }
            
            target.attributes[i].values = val.split(',');
        }
    }

    const serialize = <T>(params: T, defs: Dic<Options>) => {
        const output: Dic<Primitives> = {};

        for(const key in params) {
            const value = <any>params[key];
            const def = defs[key];

            if (def === undefined || value === def) continue;

            if (key === 'attributes') {
                handleAttrsSer(output, value);
                continue;
            }

            switch(typeof value) {
                case 'string': output[key] = value; continue;
                case 'number': output[key] = value; continue;
                case 'boolean': output[key] = value; continue;
            }

            if (typeof value !== 'string' && 
                Array.isArray(value) &&
                value.length > 0) {
                output[key] = value.join(',');
            }
        }

        return Object.keys(output).map(t => `${t}=${output[t]}`).join('&');
    };

    const deserialize = <T>(query: Dic<string | string[]>, target: T, defs: Dic<Options>) => {
        if (!query) return target;

        let at = <any>target;

        for(const key in defs) {
            const value = query[key]?.toString();
            const def = defs[key];
            if (key === 'attributes') {
                handleAttrsDeser(at, <any>query);
                continue;
            }

            if (value === undefined) continue;

            switch(typeof def) {
                case 'string': at[key] = value; continue;
                case 'number': at[key] = +value; continue;
                case 'boolean': at[key] = !!value; continue;
            }

            if (typeof def !== 'string' && Array.isArray(def)) {
                at[key] = value.split(',');
            }
        }

        return <T>at;
    }

    return {
        serialize,
        deserialize
    }
};