<template>
    <ClientOnly>
        <span>{{ dt }}</span>
    </ClientOnly>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

const { dateFormatLocal, dateFormatMicro } = useApiHelper();

const props = defineProps<{
    format?: string,
    date?: string | Date
}>();

const date = computed(() => props.date);
const format = computed(() => props.format);

const dt = computed(() => {
    const d = (date.value ?? new Date()).toString() + 'Z';
    switch (format.value) {
        case 'full': return dateFormatMicro(d);
        case 'partial': return dateFormatLocal(d, true);
        default: return dayjs(date.value).format(format.value || 'YYYY-MM-DD HH:mm');
    }
});
</script>
