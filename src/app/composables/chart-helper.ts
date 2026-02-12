import type { ChartData, Point } from 'chart.js';

type ChartOptions = ChartData<'line'>['datasets'][number];

type PropertyMap<T> = {
    label: string;
    property?: keyof T;
    func?: (item: T) => number | Point | null;
    options?: Partial<ChartOptions>;
}

type LabelMap<T> = (item: T) => string | keyof T;

export function useChartHelper() {

    function formatLine<T>(
        data: T[],
        label: LabelMap<T>,
        properties: (PropertyMap<T> | PropertyMap<T>[])
    ): ChartData<'line'> {
        type DSType = ChartData<'line'>['datasets'][number];

        label = (() => {
            if (typeof label !== 'string') return label;
            const prop = label;
            return (i: T) => i[prop];
        })();
        properties = Array.isArray(properties) ? properties : [properties];

        const labels: string[] = [];
        const datasets: DSType[] = properties.map(t => {
            return <DSType>{
                label: t.label,
                data: [],
                ...t.options
            }
        });

        for(const item of data) {
            labels.push(<string>label(item));

            for(let p = 0; p < properties.length; p++) {
                const prop = properties[p]!;
                const value = prop.property
                    ? item[prop.property] : prop.func
                    ? prop.func(item) : null;
                datasets[p]!.data.push(<any>value);
            }
        }

        return {
            labels,
            datasets
        }
    }

    return {
        formatLine
    }
}
