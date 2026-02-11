<template>
    <span
        class="date-time"
        :class="classes"
        :title="datetime?.toLocaleString(DateTime.DATETIME_FULL)"
    >{{ formatted }}</span>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon';
import type { ClassOptions, booleanish } from '~/models';
const { isTrue, serClasses } = useUtils();

const props = defineProps<{
    date?: string | Date;
    format?: string;
    muted?: booleanish;
    utc?: booleanish;
    'class'?: ClassOptions;
}>();

const classes = computed(() => serClasses(props.class, {
    'mute': isTrue(props.muted)
}))

const datetime = computed(() => {
    if (!props.date) return undefined;
    if (props.date instanceof Date) return DateTime.fromJSDate(props.date);
    let value = props.date.endsWith('Z') || !isTrue(props.utc) ? props.date : `${props.date}Z`;
    return DateTime.fromJSDate(new Date(value));
})

const formatted = computed(() => {
    const date = datetime.value;
    if (!date) return undefined;

    const format = props.format ?? 'f';
    if (format === 'r' || format === 'R') return date.toRelative();


    let formats: { [key: string]: any } = {
        't': DateTime.TIME_24_SIMPLE,
        'T': DateTime.TIME_24_WITH_SECONDS,
        'd': DateTime.DATE_SHORT,
        'D': DateTime.DATE_MED_WITH_WEEKDAY,
        'f': DateTime.DATETIME_MED,
        'F': DateTime.DATETIME_FULL
    };

    let fo = formats[format];
    return fo ? date.toLocaleString(fo) : date.toFormat(format);
});
</script>

<style lang="scss" scoped>
.bold {
    font-weight: bold;
}

.hover:hover {
    cursor: pointer;
}
</style>
