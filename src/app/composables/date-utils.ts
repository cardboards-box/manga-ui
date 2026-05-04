import { DateTime, type StartOfOptions } from "luxon";

type DateInput = Date | string | DateTime;

export function useDateUtils() {

    const opts: StartOfOptions = {
        useLocaleWeeks: true
    };

    const ensureDate = (date: DateInput): DateTime => {
        if (date instanceof Date) return DateTime.fromJSDate(date);
        if (typeof date === 'string') return DateTime.fromISO(date);
        return date;
    }

    const enumerate = (start: DateInput, end: DateInput | number, step: 'hour' | 'day' | 'week' | 'month' | 'year') => {
        start = ensureDate(start);
        end = typeof end === 'number'
            ? start.plus({ [step]: end })
            : ensureDate(end);
        const result: DateTime[] = [];
        let current = start;

        while (current <= end) {
            result.push(current);
            current = current.plus({ [step]: 1 });
        }

        return result;
    }

    const middleOf = (date: DateInput, step: 'hour' | 'day' | 'week' | 'month' | 'year') => {
        date = ensureDate(date);
        const start = date.startOf(step, opts);
        const end = date.endOf(step, opts);
        return start.plus({ milliseconds: (end.toMillis() - start.toMillis()) / 2 });
    }

    const clamp = (date: DateInput, min?: DateInput, max?: DateInput) => {
        if (!min && !max) return ensureDate(date);

        date = ensureDate(date);
        min = min ? ensureDate(min) : undefined;
        max = max ? ensureDate(max) : undefined;

        if (min && date < min) return min;
        if (max && date > max) return max;
        return date;
    }

    return {
        ensureDate,
        enumerate,
        clamp,
        middleOf: {
            hour: (date: DateInput) => middleOf(date, 'hour'),
            day: (date: DateInput) => middleOf(date, 'day'),
            week: (date: DateInput) => middleOf(date, 'week'),
            month: (date: DateInput) => middleOf(date, 'month'),
            year: (date: DateInput) => middleOf(date, 'year'),
        },
        startOf: {
            hour: (date: DateInput) => ensureDate(date).startOf('hour', opts),
            day: (date: DateInput) => ensureDate(date).startOf('day', opts),
            week: (date: DateInput) => ensureDate(date).startOf('week', opts),
            month: (date: DateInput) => ensureDate(date).startOf('month', opts),
            year: (date: DateInput) => ensureDate(date).startOf('year', opts),
        },
        endOf: {
            hour: (date: DateInput) => ensureDate(date).endOf('hour', opts),
            day: (date: DateInput) => ensureDate(date).endOf('day', opts),
            week: (date: DateInput) => ensureDate(date).endOf('week', opts),
            month: (date: DateInput) => ensureDate(date).endOf('month', opts),
            year: (date: DateInput) => ensureDate(date).endOf('year', opts),
        }
    }
}