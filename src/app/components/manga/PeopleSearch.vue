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
            role="button"
            tabindex="0"
            class="people-search-trigger"
        >
            <div
                v-if="selectedPeople.length"
                class="people-pills"
            >
                <button
                    v-for="person in selectedPeople"
                    :key="person.id"
                    type="button"
                    class="person-pill"
                    @click.stop="remove(person.id)"
                >
                    <span>{{ person.name }}</span>
                    <Icon unsize="true" size="16px">close</Icon>
                </button>
            </div>
            <span
                v-else
                class="people-placeholder"
            >{{ placeholder }}</span>
            <Icon unsize="true" size="18px">{{ open ? 'expand_less' : 'expand_more' }}</Icon>
        </div>
    </template>

    <div class="people-search-content">
        <div class="people-search-input control fill no-top group center-items">
            <input
                ref="input"
                class="fill"
                type="text"
                :placeholder="searchPlaceholder"
                v-model="search"
                @keydown.enter.prevent="selectFirst"
                @click.stop
            />
            <IconBtn
                icon="close"
                inline
                icon-size="16px"
                @click="clearSearch"
            />
        </div>

        <div class="people-options">
            <button
                v-for="person in peopleList"
                :key="person.id"
                type="button"
                class="person-option"
                :class="{ selected: isSelected(person.id) }"
                @click="togglePerson(person)"
            >
                <Icon unsize="true" size="18px">
                    {{ isSelected(person.id) ? 'check_box' : 'check_box_outline_blank' }}
                </Icon>
                <span class="person-name">{{ person.name }}</span>
                <span
                    v-if="personTypes(person)"
                    class="person-types"
                >{{ personTypes(person) }}</span>
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

const selectedPeople = computed(() => selectedIds.value.map(id => personById(id)));

const peopleList = computed(() => {
    const ids = [...selectedIds.value, ...resultIds.value];
    return [...new Set(ids)].map(id => personById(id));
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

const addResultIds = (people: MbPerson[]) => {
    const ids = people.map(person => person.id);
    resultIds.value = [...new Set([...resultIds.value, ...ids])];
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
        return;
    }

    loadingSearch.value = true;

    try {
        const response = await api.promise.people.search(term, 1, 20);
        const people = api.data(response)?.data ?? [];
        cachePeople(people);
        addResultIds(people);
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
};

const selectFirst = () => {
    const first = peopleList.value.find(person => !isSelected(person.id));
    if (first) togglePerson(first);
};

const personTypes = (person: MbPerson) => [
    person.author ? 'Author' : undefined,
    person.artist ? 'Artist' : undefined,
    person.user ? 'User' : undefined
].filter(Boolean).join(', ');

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
    padding: 6px 8px;
    text-align: left;
    width: 100%;

    &:focus,
    &:hover {
        border-color: var(--color-primary);
    }
}

.people-pills {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 5px;
    min-width: 0;
}

.person-pill {
    align-items: center;
    background-color: var(--bg-color-accent-dark);
    border: 1px solid var(--bg-color-accent-dark);
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    gap: 5px;
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

.people-placeholder {
    color: var(--color-muted-light);
    flex: 1;
}

.people-search-content {
    padding: 8px;
}

.people-search-input {
    background-color: var(--bg-color-accent);
    border-radius: var(--brd-radius);
    margin-bottom: 8px;
}

.people-options {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.person-option {
    align-items: center;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: var(--brd-radius);
    color: var(--color);
    display: grid;
    gap: 8px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    min-height: 38px;
    padding: 6px 8px;
    text-align: left;
    width: 100%;

    &:hover,
    &.selected {
        background-color: var(--bg-color-accent);
        border-color: var(--bg-color-accent-dark);
    }
}

.person-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.person-types,
.people-message {
    color: var(--color-muted-light);
    font-size: .85rem;
}

.people-message {
    margin: 8px 2px 2px;
}
</style>
