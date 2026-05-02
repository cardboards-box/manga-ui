<template>
    <div class="calendar" :class="classes" :style="actStyles">
        <template v-if="template === 'month'">
            <header>
                <button class="month-selector" @click="template = 'year'">
                    {{ rangeDate.monthLong }}, {{ rangeDate.year }}
                </button>
                <button class="arrow" @click="moveMonth(-1)">
                    <Icon>arrow_upward_alt</Icon>
                </button>
                <button class="arrow" @click="moveMonth(1)">
                    <Icon>arrow_downward_alt</Icon>
                </button>
            </header>
            <div class="seven-days">
                <div
                    class="day header"
                    v-for="item in selectorRange.iterations[0]?.iterations ?? []"
                    :key="item.key"
                >
                    {{ item.date.weekdayShort }}
                </div>
            </div>
            <div
                class="seven-days"
                v-for="item in selectorRange.iterations"
                :key="item.start.toISODate()!"
            >
                <button
                    class="day"
                    :class="{
                        'diff-month': !day.sameMonth,
                        'today': day.isToday,
                        'selected': day.isDate,
                        'in-range': day.inRange
                    }"
                    v-for="day in item.iterations"
                    :key="day.key"
                    @click="() => date = day.date"
                    :disabled="!day.inRange"
                >
                    {{ day.date.day }}
                </button>
            </div>
        </template>
        <template v-else-if="template === 'year'">
            <header>
                <button class="month-selector" @click="template = 'month'">
                    {{ rangeDate.year }}
                </button>
                <button class="arrow" @click="moveMonth(-12)">
                    <Icon>arrow_upward_alt</Icon>
                </button>
                <button class="arrow" @click="moveMonth(12)">
                    <Icon>arrow_downward_alt</Icon>
                </button>
            </header>
            <div
                class="seven-days"
                v-for="(row, index) in yearRange"
                :key="index"
            >
                <button
                    class="day"
                    :class="{
                        'today': day.isToday,
                        'selected': day.isSelected,
                        'in-range': day.inRange
                    }"
                    v-for="day in row"
                    :key="day.date.toISODate()!"
                    @click="() => { _rangeDate = day.date; template = 'month'; }"
                    :disabled="!day.inRange"
                >
                    {{ day.date.monthShort }}
                </button>
            </div>
        </template>
        <footer>
            <button class="selector" @click="_rangeDate = date">
                {{ date.toFormat('LLLL dd, yyyy') }}
            </button>
            <button class="today" @click="today">
                Today
            </button>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon';
import type { ClassOptions, StyleOptions } from '~/models';
type DateInput = Date | string | DateTime;

const dateUtils = useDateUtils();
const { serStyles, serClasses, chunk } = useUtils();

const THEME = {
    color: '#c4c0d8',
    colorDisabled: '#5c5870',
    colorSelected: '#61ffca',
    colorBackground: '#282738',
    colorBackgroundDark: '#21202e',
    size: '1.5em',
    margin: '1rem',
    padding: '0.25em',
    fontSize: '1rem'
} as const;

type Theme = {
    [key in keyof typeof THEME]: string;
};

const props = defineProps<{
    modelValue: DateInput;
    rangeMin?: DateInput;
    rangeMax?: DateInput;
    'class'?: ClassOptions;
    'styles'?: StyleOptions;
    theme?: Partial<Theme>;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: Date): void;
}>();

const date = computed({
    get: () => {
        const date = dateUtils.ensureDate(props.modelValue);
        return dateUtils.clamp(date, props.rangeMin, props.rangeMax);
    },
    set: (value: DateInput) => {
        const date = dateUtils.ensureDate(value);
        const clampedDate = dateUtils.clamp(date, props.rangeMin, props.rangeMax);
        emits('update:modelValue', clampedDate.toJSDate());
    }
});

const _rangeDate = ref<DateTime>();
const template = ref<'month' | 'year'>('month');

const rangeDate = computed(() => _rangeDate.value ?? date.value);

const monthStart = computed(() => dateUtils.startOf.month(rangeDate.value));
const monthEnd = computed(() => dateUtils.endOf.month(rangeDate.value));
const monthMiddle = computed(() => dateUtils.middleOf.month(rangeDate.value));
const classes = computed(() => serClasses(props.class));
const actStyles = computed(() => serStyles(props.styles, {
    '--dts-color': props.theme?.color ?? THEME.color,
    '--dts-color-disabled': props.theme?.colorDisabled ?? THEME.colorDisabled,
    '--dts-color-selected': props.theme?.colorSelected ?? THEME.colorSelected,
    '--dts-color-background': props.theme?.colorBackground ?? THEME.colorBackground,
    '--dts-color-background-dark': props.theme?.colorBackgroundDark ?? THEME.colorBackgroundDark,
    '--dts-size': props.theme?.size ?? THEME.size,
    '--dts-margin': props.theme?.margin ?? THEME.margin,
    '--dts-padding': props.theme?.padding ?? THEME.padding,
    '--dts-font-size': props.theme?.fontSize ?? THEME.fontSize,
}));

const selectorRange = computed(() => {
    const startMonth = dateUtils.startOf.week(monthStart.value);
    const endMonth = dateUtils.endOf.week(monthEnd.value);

    const iterations = dateUtils.enumerate(startMonth, endMonth, 'week').map(t => {
        const start = dateUtils.startOf.week(t);
        const end = dateUtils.endOf.week(t);
        const iterations = dateUtils.enumerate(start, end, 'day').map(d => {
            return {
                key: d.toISODate()!,
                date: d,
                sameMonth: d.month === rangeDate.value.month,
                isToday: d.hasSame(DateTime.now(), 'day'),
                isDate: d.hasSame(date.value, 'day'),
                inRange: (!props.rangeMin || d >= dateUtils.ensureDate(props.rangeMin)) &&
                    (!props.rangeMax || d <= dateUtils.ensureDate(props.rangeMax))
            }
        });
        return { start, end, iterations };
    });

    return {
        start: startMonth,
        end: endMonth,
        iterations
    }
});

const yearRange = computed(() => {
    const startYear = dateUtils.startOf.year(rangeDate.value);
    const endYear = dateUtils.endOf.year(rangeDate.value);

    const months = dateUtils
        .enumerate(startYear, endYear, 'month')
        .map(t => {
            const start = dateUtils.startOf.month(t);
            const end = dateUtils.endOf.month(t);
            const middle = dateUtils.middleOf.month(t);

            return {
                start,
                end,
                date: middle,
                sameMonth: t.month === rangeDate.value.month,
                isToday: middle.hasSame(DateTime.now(), 'day'),
                inRange: (!props.rangeMin || end >= dateUtils.ensureDate(props.rangeMin)) &&
                    (!props.rangeMax || start <= dateUtils.ensureDate(props.rangeMax)),
                isSelected: date.value >= start && date.value <= end
            }
        });
    return chunk(months, 3);
});

const moveMonth = (step: number) => {
    _rangeDate.value = monthMiddle.value.plus({ month: step });
}

const today = () => {
    _rangeDate.value = date.value = DateTime.now();
    template.value = 'month';
}

</script>

<style lang="scss" scoped>
$color: var(--dts-color);
$color-disabled: var(--dts-color-disabled);
$color-selected: var(--dts-color-selected);
$color-background: var(--dts-color-background);
$color-background-dark: var(--dts-color-background-dark);
$size: var(--dts-size);
$margin: var(--dts-margin);
$padding: var(--dts-padding);
$font-size: var(--dts-font-size);

.calendar {
    display: flex;
    flex-flow: column;
    margin: auto;
    color: $color;
    background-color: $color-background;
    border-radius: 5px;
    font-size: $font-size;
    width: 315px;

    button {
        font-size: $font-size;
        border: none;
        background: none;
        padding: $padding;
        margin: $padding;

        &:hover {
            cursor: pointer;
            background-color: $color-background-dark;
        }

        &:disabled {
            cursor: not-allowed;
            color: $color-disabled;
        }
    }

    header, footer {
        display: flex;
        flex-flow: row;
        background-color: $color-background-dark;
        color: $color-selected;
        padding: 0 $margin;

        .month-selector {
            font-weight: bold;
            flex: 1;
            text-align: left;
        }

        .arrow {
            padding-top: $padding;
        }

        .selector {
            flex: 1;
            text-align: left;
        }
    }

    .seven-days {
        display: flex;
        flex-flow: row;
        padding: 0 #{$margin};

        .day {
            width: $size;
            height: $size;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: $padding;
            margin: $padding;
            flex: 1;
            text-align: center;

            &.diff-month { color: $color-disabled; }
            &.today { text-decoration: underline; }
            &.header { font-weight: bold; }

            &.selected {
                color: $color-selected;
                background-color: $color-background-dark;
            }

            &:disabled {
                color: $color-disabled;
                cursor: not-allowed;
            }
        }
    }
}
</style>