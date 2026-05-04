<template>
    <div class="date-filter flex row">
        <div class="flex">
            <CheckBox
                v-model="useDate"
            />
            <label class="center-vert fill">{{ message }}</label>
            <div
                class="center-vert margin-right shown-date"
                v-if="beforeDate && afterDate"
            >
                (&nbsp;
                <Date :date="beforeDate" format="D" class="mute" />
                &nbsp;-&nbsp;
                <Date :date="afterDate" format="D" class="mute" />
                &nbsp;)
            </div>
        </div>
        <div class="flex calendar-selector margin-top" v-if="beforeDate && afterDate">
            <div class="center picker">
                <CalendarPicker
                    v-model="afterDate"
                    :range-min="min"
                    :range-max="beforeDate"
                />
            </div>
            <p class="center between">Between</p>
            <div class="center picker">
                <CalendarPicker
                    v-model="beforeDate"
                    :range-min="afterDate"
                    :range-max="max"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
const dateUtils = useDateUtils();

const props = defineProps<{
    before?: Date | string;
    after?: Date | string;
    message: string;
    min?: Date | string;
    max?: Date | string;
}>();

const emit = defineEmits<{
    (e: 'update:before', value: string | undefined): void;
    (e: 'update:after', value: string | undefined): void;
}>();

const useDate = computed({
    get: () => !!props.before || !!props.after,
    set: (value) => {
        if (!value) {
            emit('update:before', undefined);
            emit('update:after', undefined);
            return;
        }

        const now = new Date();
        const date = dateUtils.clamp(props.before ?? props.after ?? now, props.min, props.max)?.toJSDate();
        beforeDate.value = date;
        afterDate.value = date;
    }
});

const beforeDate = computed({
    get: () => props.before,
    set: (value: string | Date | undefined) => {
        const date = value instanceof Date ? value.toISOString() : value;
        emit('update:before', date);
    }
});

const afterDate = computed({
    get: () => props.after,
    set: (value: string | Date | undefined) => {
        const date = value instanceof Date ? value.toISOString() : value;
        emit('update:after', date);
    }
});
</script>

<style lang="scss" scoped>

@media screen and (max-width: 820px) {
    .shown-date {
        display: none;
    }

    .calendar-selector {
        flex-direction: column;
        align-items: center;

        .between {
            margin: 0.5rem 0;
        }
    }
}
</style>
