<template>
<Dropdown
    v-model="open"
    match-width
    :min-width="260"
    :max-height="420"
    panel-class="people-search-panel"
    class="people-search"
>
    <template #trigger="{ triggerProps }">
        <div
            v-bind="triggerProps"
            class="people-search-trigger"
            @click="focusInput"
        >
            <div
                v-if="selectedPeople.length && !open"
                class="people-search-collapsed-pills"
                @click.stop="open = true"
            >
                <button
                    v-for="person in selectedPeople"
                    :key="person.id"
                    type="button"
                    class="person-pill"
                    :title="person.name"
                    @click.stop="togglePerson(person)"
                >
                    <Icon unsize="true" size="15px">person</Icon>
                    <span>{{ person.name }}</span>
                </button>
            </div>
            <input
                ref="input"
                v-model="search"
                class="people-search-input"
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
                v-if="selectedPeople.length"
                icon="close"
                inline
                icon-size="16px"
                title="Reset people"
                @click="reset"
            />
            <Icon unsize="true" size="18px">{{ open ? 'expand_less' : 'expand_more' }}</Icon>
        </div>
    </template>

    <div class="people-search-content">
        <div
            v-if="selectedPeople.length"
            class="selected-people"
        >
            <button
                v-for="person in selectedPeople"
                :key="person.id"
                type="button"
                class="selected-person"
                :title="person.name"
                @click.stop="togglePerson(person)"
                @pointerdown.prevent.stop
            >
                <Icon unsize="true" size="15px">person</Icon>
                <span>{{ person.name }}</span>
            </button>
        </div>

        <div class="people-options">
            <button
                v-for="person in peopleList"
                :key="person.id"
                type="button"
                class="person-option"
                :class="{ selected: isSelected(person.id) }"
                :title="person.name"
                @click.stop="togglePerson(person)"
                @pointerdown.prevent.stop
            >
                <Icon
                    v-if="isSelected(person.id)"
                    unsize="true"
                    size="15px"
                >
                    check_circle
                </Icon>
                <span class="person-name">{{ person.name }}</span>
            </button>
        </div>

        <p
            v-if="message"
            class="people-message"
        >{{ message }}</p>
    </div>
</Dropdown>
</template>

<script setup lang="ts">
import type { MbPerson } from '~/models';

const api = useMangaApi();
const { debounce } = useUtils();

const props = withDefaults(defineProps<{
    modelValue?: string[];
    placeholder?: string;
    searchPlaceholder?: string;
}>(), {
    placeholder: 'Select people',
    searchPlaceholder: 'Search for people'
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
}>();

const open = ref(false);
const search = ref('');
const input = ref<HTMLInputElement>();
const loadingSearch = ref(false);
const loadingIds = ref(false);
const error = ref<string>();
const peopleCache = ref<Record<string, MbPerson>>({});
const resultIds = ref<string[]>([]);
const resolvingIds = ref<Set<string>>(new Set());

const selectedIds = computed({
    get: () => props.modelValue ?? [],
    set: (value: string[]) => emit('update:modelValue', value)
});

const selectedPeople = computed(() => selectedIds.value.map(id => personById(id))
    .toSorted((a, b) => a.name.localeCompare(b.name)));

const peopleList = computed(() => {
    const ids = [...selectedIds.value, ...resultIds.value];
    return [...new Set(ids)]
        .map(id => personById(id))
        .toSorted((a, b) => a.name.localeCompare(b.name));
});

const message = computed(() => {
    if (loadingIds.value) return 'Loading selected people...';
    if (loadingSearch.value) return 'Searching...';
    if (error.value) return error.value;
    if (!search.value.trim() && peopleList.value.length === 0) return 'Search to add people';
    if (search.value.trim().length > 0 && search.value.trim().length < 2) return 'Type at least 2 characters to search';
    if (search.value.trim().length >= 2 && peopleList.value.length === selectedPeople.value.length) return 'No new people found';
    return undefined;
});

const placeholderText = computed(() => {
    if (open.value) return props.searchPlaceholder;
    if (selectedPeople.value.length) return 'Search people';
    return props.placeholder;
});

const personById = (id: string): MbPerson => peopleCache.value[id] ?? {
    id,
    createdAt: '',
    updatedAt: '',
    name: id,
    artist: false,
    author: false,
    user: false
};

const cachePeople = (people: MbPerson[]) => {
    if (people.length === 0) return;

    peopleCache.value = {
        ...peopleCache.value,
        ...Object.fromEntries(people.map(person => [person.id, person]))
    };
};

const resolveSelectedPeople = async () => {
    const ids = selectedIds.value.filter(id => !peopleCache.value[id] && !resolvingIds.value.has(id));
    if (ids.length === 0) return;

    resolvingIds.value = new Set([...resolvingIds.value, ...ids]);
    loadingIds.value = true;
    error.value = undefined;

    try {
        const response = await api.promise.people.get(ids);
        const people = api.data(response) ?? [];
        cachePeople(people);
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unable to load selected people';
    } finally {
        resolvingIds.value = new Set([...resolvingIds.value].filter(id => !ids.includes(id)));
        loadingIds.value = resolvingIds.value.size > 0;
    }
};

const runSearch = async (value: string) => {
    const term = value.trim();
    error.value = undefined;

    if (term.length < 2) {
        loadingSearch.value = false;
        resultIds.value = [];
        return;
    }

    loadingSearch.value = true;

    try {
        const response = await api.promise.people.search(term, 1, 20);
        const people = api.data(response)?.data ?? [];
        cachePeople(people);
        resultIds.value = people.map(person => person.id);
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unable to search people';
    } finally {
        loadingSearch.value = false;
    }
};

const debouncedSearch = debounce<string>(runSearch, 250);

const isSelected = (id: string) => selectedIds.value.includes(id);

const togglePerson = (person: MbPerson) => {
    cachePeople([person]);

    selectedIds.value = isSelected(person.id)
        ? selectedIds.value.filter(id => id !== person.id)
        : [...selectedIds.value, person.id];
};

const remove = (id: string) => {
    selectedIds.value = selectedIds.value.filter(personId => personId !== id);
};

const clearSearch = () => {
    search.value = '';
    error.value = undefined;
    nextTick(() => input.value?.focus());
};

const selectFirst = () => {
    const first = peopleList.value.find(person => !isSelected(person.id));
    if (first) togglePerson(first);
};

const reset = () => {
    selectedIds.value = [];
    search.value = '';
    resultIds.value = [];
};

const focusInput = () => {
    open.value = true;
    nextTick(() => input.value?.focus());
};

watch(search, value => debouncedSearch(value));

watch(selectedIds, ids => {
    if (ids.length === 0) {
        search.value = '';
        resultIds.value = [];
    }

    resolveSelectedPeople();
}, { immediate: true, deep: true });

watch(open, value => {
    if (value) nextTick(() => input.value?.focus());
});
</script>

<style scoped lang="scss">
.people-search {
    display: block;
    max-width: 100%;
    min-width: 0;
    width: 100%;
}

.people-search-trigger {
    align-items: center;
    background-color: var(--bg-color-accent);
    border: 1px solid var(--bg-color-accent);
    border-radius: var(--brd-radius);
    color: var(--color);
    display: flex;
    gap: 8px;
    min-height: 42px;
    box-sizing: border-box;
    padding: 6px 8px;
    text-align: left;
    width: 100%;

    &:focus-within,
    &:hover {
        border-color: var(--color-primary);
    }
}

.people-search-collapsed-pills {
    display: flex;
    flex: 0 1 auto;
    gap: 5px;
    max-width: 75%;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
}

.person-pill,
.selected-person {
    align-items: center;
    background-color: var(--bg-color-accent-dark);
    border: 1px solid transparent;
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    flex: 0 0 auto;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
    padding: 3px 7px;

    &:hover {
        border-color: var(--color-primary);
    }

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.people-search-input {
    background: transparent;
    border: 0;
    box-sizing: border-box;
    color: var(--color);
    flex: 1 1 10ch;
    min-width: 10ch;
    outline: 0;
    width: auto;
}

.people-search-content {
    padding: 8px;
}

.selected-people {
    border-bottom: 1px solid var(--bg-color-accent-dark);
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 8px;
    max-height: 120px;
    overflow-y: auto;
    padding-bottom: 8px;
}

.people-options {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.person-option {
    align-items: center;
    background-color: var(--bg-color-accent);
    border: 1px solid var(--color-muted-light);
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    gap: 5px;
    max-width: 100%;
    min-height: 28px;
    min-width: 0;
    padding: 4px 8px;
    text-align: left;

    &:hover,
    &.selected {
        background-color: var(--bg-color-accent-dark);
        border-color: var(--color);
    }

    &.selected {
        border-color: var(--color-primary);
    }
}

.person-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.people-message {
    color: var(--color-muted-light);
    font-size: .85rem;
}

.people-message {
    margin: 8px 2px 2px;
}
</style>
