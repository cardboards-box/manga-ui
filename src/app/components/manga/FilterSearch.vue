<template>
<div class="filter-search-wrap">
    <Dropdown
        v-model="open"
        match-width
        :min-width="280"
        :max-height="420"
        panel-class="filter-search-panel"
        class="filter-search"
    >
        <template #trigger="{ triggerProps }">
            <div
                v-bind="triggerProps"
                class="filter-search-trigger"
                @click="focusInput"
            >
                <div
                    v-if="selectedOptions.length && !open"
                    class="filter-search-pills"
                    @click.stop="open = true"
                >
                    <button
                        v-for="option in selectedOptions"
                        :key="optionKey(option.value)"
                        type="button"
                        class="filter-pill include"
                        :title="option.description"
                        @click.stop="toggle(option.value)"
                    >
                        <Icon unsize="true" size="15px">add</Icon>
                        <span>{{ option.name }}</span>
                    </button>
                </div>
                <input
                    ref="input"
                    v-model="search"
                    class="filter-search-input"
                    type="text"
                    :placeholder="placeholderText"
                    @focus="open = true"
                    @keydown.enter.prevent="selectFirst"
                    @keydown.esc.stop="open = false"
                    @click.stop
                />
                <IconBtn
                    v-if="search"
                    icon="backspace"
                    inline
                    icon-size="16px"
                    title="Clear search"
                    @click="clearSearch"
                />
                <IconBtn
                    v-if="clearable && selectedOptions.length"
                    icon="close"
                    inline
                    icon-size="16px"
                    title="Clear selection"
                    @click="clearSelection"
                />
                <Icon unsize="true" size="18px">{{ open ? 'expand_less' : 'expand_more' }}</Icon>
            </div>
        </template>

        <div class="filter-search-content">
            <div
                v-if="selectedOptions.length"
                class="selected-options"
            >
                <button
                    v-for="option in selectedOptions"
                    :key="optionKey(option.value)"
                    type="button"
                    class="filter-option include"
                    :title="option.description"
                    @click.stop="toggle(option.value)"
                    @pointerdown.stop
                >
                    <Icon unsize="true" size="15px">add</Icon>
                    <span>{{ option.name }}</span>
                </button>
            </div>

            <div class="filter-options">
                <button
                    v-for="option in visibleOptions"
                    :key="optionKey(option.value)"
                    type="button"
                    class="filter-option"
                    :class="{ include: isSelected(option.value) }"
                    :title="option.description"
                    @click.stop="toggle(option.value)"
                    @pointerdown.stop
                >
                    <Icon
                        v-if="isSelected(option.value)"
                        unsize="true"
                        size="15px"
                    >add_circle</Icon>
                    <span>{{ option.name }}</span>
                </button>
            </div>

            <p
                v-if="message"
                class="filter-message"
            >{{ message }}</p>
        </div>
    </Dropdown>
</div>
</template>

<script setup lang="ts">
type OptionValue = string | number;
type FilterOption = {
    name: string;
    value: OptionValue;
    description?: string;
};

const props = withDefaults(defineProps<{
    modelValue?: OptionValue | OptionValue[];
    options: FilterOption[];
    placeholder: string;
    searchPlaceholder?: string;
    multi?: boolean;
    clearable?: boolean;
}>(), {
    clearable: true,
    searchPlaceholder: undefined
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: OptionValue | OptionValue[] | undefined): void;
}>();

const open = ref(false);
const search = ref('');
const input = ref<HTMLInputElement>();

const normalizedOptions = computed(() => props.options.map(option => ({
    ...option,
    name: formatLabel(option.name)
})));

const selectedValues = computed<OptionValue[]>(() => {
    if (Array.isArray(props.modelValue)) return props.modelValue;
    if (props.modelValue === undefined || props.modelValue === null) return [];
    return [props.modelValue];
});

const selectedOptions = computed(() => selectedValues.value
    .map(value => optionByValue(value))
    .filter((option): option is FilterOption => !!option));

const visibleOptions = computed(() => {
    const term = search.value.trim().toLocaleLowerCase();
    if (!term) return normalizedOptions.value;

    return normalizedOptions.value.filter(option => [
        option.name,
        option.description,
        option.value.toString()
    ].some(text => text?.toLocaleLowerCase().includes(term)));
});

const placeholderText = computed(() => selectedOptions.value.length && !open.value
    ? props.placeholder
    : props.searchPlaceholder ?? props.placeholder);

const message = computed(() => visibleOptions.value.length === 0 ? 'No matching options' : undefined);

function optionByValue(value: OptionValue) {
    return normalizedOptions.value.find(option => option.value === value) ?? {
        name: value.toString(),
        value
    };
}

function isSelected(value: OptionValue) {
    return selectedValues.value.includes(value);
}

function toggle(value: OptionValue) {
    if (!props.multi) {
        emit('update:modelValue', value);
        return;
    }

    emit('update:modelValue', isSelected(value)
        ? selectedValues.value.filter(selected => selected !== value)
        : [...selectedValues.value, value]);
}

function clearSelection() {
    emit('update:modelValue', props.multi ? [] : undefined);
    nextTick(() => input.value?.focus());
}

function clearSearch() {
    search.value = '';
    nextTick(() => input.value?.focus());
}

function selectFirst() {
    const first = visibleOptions.value.find(option => !isSelected(option.value)) ?? visibleOptions.value[0];
    if (first) toggle(first.value);
}

function focusInput() {
    open.value = true;
    nextTick(() => input.value?.focus());
}

function optionKey(value: OptionValue) {
    return `${typeof value}:${value}`;
}

function formatLabel(value: string) {
    return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(/([\s/_-]+)/)
        .map(part => /^[\s/_-]+$/.test(part)
            ? part
            : part ? part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase() : part)
        .join('');
}

watch(open, value => {
    if (value) nextTick(() => input.value?.focus());
});
</script>

<style scoped lang="scss">
.filter-search-wrap,
.filter-search {
    display: block;
    max-width: 100%;
    min-width: 0;
    width: 100%;
}

.filter-search-wrap {
    box-sizing: border-box;
    flex: 0 1 auto;
}

.filter-search-trigger {
    align-items: center;
    background-color: var(--bg-color-accent);
    border: 1px solid var(--bg-color-accent);
    border-radius: var(--brd-radius);
    box-sizing: border-box;
    color: var(--color);
    display: flex;
    gap: 8px;
    min-height: 42px;
    padding: 6px 8px;
    width: 100%;

    &:focus-within,
    &:hover {
        border-color: var(--color-primary);
    }
}

.filter-search-pills {
    display: flex;
    flex: 0 1 auto;
    gap: 5px;
    max-width: 75%;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
}

.filter-pill,
.filter-option {
    align-items: center;
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    gap: 5px;
    min-width: 0;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.filter-pill {
    background-color: var(--color-primary);
    border: 1px solid transparent;
    flex: 0 0 auto;
    padding: 3px 7px;

    &:hover {
        border-color: var(--color);
    }
}

.filter-search-input {
    background: transparent;
    border: 0;
    box-sizing: border-box;
    color: var(--color);
    flex: 1 1 10ch;
    min-width: 10ch;
    outline: 0;
    width: auto;
}

.filter-search-content {
    padding: 8px;
}

.selected-options {
    border-bottom: 1px solid var(--bg-color-accent-dark);
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 8px;
    max-height: 120px;
    overflow-y: auto;
    padding-bottom: 8px;
}

.filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.filter-option {
    background-color: var(--bg-color-accent);
    border: 1px solid var(--color-muted-light);
    max-width: 100%;
    min-height: 28px;
    padding: 4px 8px;
    text-align: left;

    &:hover,
    &.include {
        background-color: var(--bg-color-accent-dark);
        border-color: var(--color);
    }

    &.include {
        border-color: var(--color-primary);
    }
}

.filter-message {
    color: var(--color-muted-light);
    font-size: .85rem;
    margin: 8px 2px 2px;
}
</style>
