<template>
    <Error v-if="error" :message="error"  />
    <CardList
        v-else
        :title="title"
        :manga="results"
        :pending="loading"
        v-model="headerStuck"
        @reload="() => refresh()"
        @load-page="(v) => updateRoute({ page: v })"
        @back="back"
        :pagination="{
            page: filter.page ?? 1,
            pages: pages,
            size: filter.size ?? 20,
            total: total
        }"
        :content-ratings="contentRatings"
    >
        <InputGroup
            v-model="searchFilters.search"
            placeholder="Search for your favourite manga!"
            :stuck="headerStuck"
            @search="() => doSearch()"
            is-drawer
        >
            <template #input>
                <StatesFilter v-model="searchFilters" />
                <label>({{ results.length }} / {{ total }})</label>
            </template>

            <h3 class="margin-bottom">Advanced Search Options:</h3>

            <div class="flex row">
                <label>Manga Tags:</label>
                <TagSearch v-model="searchFilters" :tags="tags" :sources="sources" />
            </div>

            <Drawer title="People" storage-key="manga-filter-people" default-closed>
                <div class="flex row">
                    <label>Include People:</label>
                    <PeopleSearch
                        v-model="searchFilters.people"
                        placeholder="Select people to include"
                    />
                </div>
                <div class="flex row margin-top">
                    <label>Exclude People:</label>
                    <PeopleSearch
                        v-model="searchFilters.peopleEx"
                        placeholder="Select people to exclude"
                    />
                </div>

                <div class="flex margin-top">
                    <div class="margin-right">
                        <label>People Inclusion Mode:</label>
                        <ButtonGroupBool
                            v-model="searchFilters.peopleAnd"
                            on="And"
                            off="Or"
                            on-icon="join_inner"
                            off-icon="orbit"
                        />
                    </div>
                    <div class="margin-left">
                        <label>People Exclusion Mode:</label>
                        <ButtonGroupBool
                            v-model="searchFilters.peopleExAnd"
                            on="And"
                            off="Or"
                            on-icon="join_inner"
                            off-icon="orbit"
                        />
                    </div>
                </div>
            </Drawer>

            <Drawer title="Manga Status" storage-key="manga-filter-states" default-closed>
                <label v-if="mangaStateText === 'All'">Show All Manga</label>
                <label v-else-if="mangaStateText === 'Custom Filter'">Show Based on my Filters</label>
                <label v-else-if="mangaStateText === 'Not Touched' && !searchFilters.statesInclude">Show manga I have touched (you pedo)</label>
                <label v-else>Show manga I have{{ searchFilters.statesInclude ? ' ' : ' not ' }}{{ mangaStateText }}</label>
                <ButtonGroup :options="mangaState" v-model="searchFilters.states" />

                <div class="flex margin-top">
                    <div class="margin-right">
                        <label>State Inclusion Mode:</label>
                        <ButtonGroupBool
                            v-model="searchFilters.statesInclude"
                            on="Matches"
                            off="Does Not Match"
                            on-icon="check_circle"
                            off-icon="cancel"
                        />
                    </div>
                    <div class="margin-left">
                        <label>State Concatenation Mode:</label>
                        <ButtonGroupBool
                            v-model="searchFilters.statesAnd"
                            on="And"
                            off="Or"
                            on-icon="join_inner"
                            off-icon="orbit"
                        />
                    </div>
                </div>
            </Drawer>

            <Drawer title="Date Filters" storage-key="manga-filter-mdates" default-closed>
                <DateFilter
                    v-model:before="searchFilters.mBefore"
                    v-model:after="searchFilters.mAfter"
                    message="Manga Added Between:"
                    :max="new Date()"
                    :min="APPLICATION_START_DATE"
                />
                <DateFilter
                    v-model:before="searchFilters.cFirstBefore"
                    v-model:after="searchFilters.cFirstAfter"
                    message="First Chapter Added Between:"
                    :max="new Date()"
                    :min="APPLICATION_START_DATE"
                />
                <DateFilter
                    v-model:before="searchFilters.cLastBefore"
                    v-model:after="searchFilters.cLastAfter"
                    message="Latest Chapter Added Between:"
                    :max="new Date()"
                    :min="APPLICATION_START_DATE"
                />
            </Drawer>

            <div class="flex row margin-top margin-bottom">
                <label>Minimum Chapter Count:</label>
                <input type="number" v-model="searchFilters.chapMin" />
            </div>

            <div class="flex row margin-top margin-bottom">
                <label>Maximum Chapter Count:</label>
                <input type="number" v-model="searchFilters.chapMax" />
            </div>

            <div class="flex row margin-top">
                <label>Manga Sources:</label>
                <FilterSearch
                    v-model="searchFilters.sources"
                    :options="sourceOptions"
                    placeholder="Search sources"
                    search-placeholder="Search sources"
                    multi
                />
            </div>

            <div class="flex row margin-top">
                <label>Content Ratings:</label>
                <FilterSearch
                    v-model="searchFilters.ratings"
                    :options="contentRatingOptions"
                    placeholder="Search ratings"
                    search-placeholder="Search ratings"
                    multi
                />
            </div>

            <div class="flex row margin-top">
                <label>Order By:</label>
                <FilterSearch
                    v-model="searchFilters.order"
                    :options="mangaOrderByOptions"
                    placeholder="Search order options"
                    search-placeholder="Search order options"
                    :clearable="false"
                />
            </div>

            <label class="margin-top">Order Direction:</label>
            <ButtonGroupBool v-model="searchFilters.asc" on="Ascending" off="Descending" />

            <div class="flex align-left">
                <button class="icon-btn" @click="clearFilters()">
                    <Icon>delete</Icon>
                    <p>Clear</p>
                </button>
                <button class="icon-btn" @click="doSearch()">
                    <Icon>search</Icon>
                    <p>Search</p>
                </button>
            </div>

        </InputGroup>
        <template #card-title="{ manga }">
            <slot name="card-title" :manga="manga" />
        </template>
        <template #card-body="{ manga }">
            <slot name="card-body" :manga="manga" />
        </template>
    </CardList>
</template>

<script setup lang="ts">
import type { LocationQueryValue } from 'vue-router';
import { MangaOrderBy, STATE_ROLLUP, APPLICATION_START_DATE } from '~/models';
import type { booleanish, MangaSearchFilter, StateRollup } from '~/models';

const api = useMangaApi();
const route = useRoute();
const router = useRouter();
const { canRead } = useAuthHelper();
const { addParams } = useSettingsHelper();
const cache = useCacheHelper();
const { throttle, isTrue } = useUtils();
const { searchManga } = useMangaUtils();

const props = defineProps<{
    filters?: MangaSearchFilter;
    state?: StateRollup;
    title?: string;
    error?: string;
    pending?: booleanish;
    refreshTrigger?: boolean;
}>();

const DEFAULT_FILTERS : MangaSearchFilter = {
    page: 1,
    size: 20,
    search: '',
    order: MangaOrderBy.LastChapterCreatedAt,
    asc: false,
    ratings: [],
    tags: [],
    tagsEx: [],
    sources: [],
    tagsAnd: true,
    tagsExAnd: false,
    people: [],
    peopleEx: [],
    peopleAnd: true,
    peopleExAnd: false,
    states: [],
    statesInclude: true,
    statesAnd: false,
    chapMin: 0
} as const;

const defaultFilters = computed(() => ({
    ...DEFAULT_FILTERS,
    ...props.filters,
}));

const { data: cached } = useAsyncData(async () => await cache.get());
const tags = computed(() => cached.value?.tags ?? []);
const sources = computed(() => cached.value?.sources ?? []);
const contentRatings = computed(() => cached.value?.contentRatings ?? []);
const mangaOrderBy = computed(() => cached.value?.mangaOrderBy ?? []);
const mangaState = computed(() => cached.value?.mangaState ?? []);

const headerStuck = ref(false);
const _error = ref<string>();
const filter = computed(() => parseFilters());
const searchFilters = ref(parseFilters());
const { data, error: rawError, pending, refresh } = useAsyncData(
    `search-${route.fullPath}`,
    async () => await searchManga(parseFilters()),
    { watch: [() => route.query, () => props.refreshTrigger] }
);
const results = computed(() => (data.value ? api.data(data.value)?.data : []) ?? []);
const total = computed(() => (data.value ? api.data(data.value)?.total : 0));
const pages = computed(() => (data.value ? api.data(data.value)?.pages : 0));
const loading = computed(() => pending.value || isTrue(props.pending));
const error = computed({
    get: () => props.error ?? _error.value ?? rawError.value?.message,
    set: (value) => _error.value = value
});

const title = computed(() => props.title ?? route.params.type?.toString() ?? 'Search');
const back = () => history.back();

const page = computed({
    get: () => filter.value.page ?? 1,
    set: (value) => updateRoute({ page: value })
});

const size = computed({
    get: () => filter.value.size ?? 20,
    set: (value) => updateRoute({ size: value })
});

const mangaStateText = computed(() => {
    return STATE_ROLLUP.find(s => s.get(searchFilters.value))!.text;
})

const sourceOptions = computed(() => sources.value.map(source => ({
    name: source.name,
    value: source.id,
    description: source.baseUrl
})));
const contentRatingOptions = computed(() => contentRatings.value.map(rating => ({
    name: rating.name,
    value: rating.value,
    description: rating.description
})));
const mangaOrderByOptions = computed(() => mangaOrderBy.value.map(order => ({
    name: order.name,
    value: order.value,
    description: order.description
})));

const updateRoute = (merge?: Partial<MangaSearchFilter>) => {
    const fil = normalizeFilters({ ...filter.value, ...merge });

    const uri = props.state
        ? STATE_ROLLUP.find(s => s.get(fil))!.routes
        : route.path;
    const url = addParams(uri, fil);
    router.push(url);
}

const clearFilters = () => {
    const curPage = page.value;
    const curSize = size.value;
    updateRoute({
        ...defaultFilters.value,
        page: curPage,
        size: curSize
    });
}

const doSearch = () => {
    updateRoute(normalizeFilters(searchFilters.value));
}

function normalizeFilters(value: MangaSearchFilter): MangaSearchFilter {
    return {
        ...value,
        ratings: [...(value.ratings ?? [])],
        tags: [...(value.tags ?? [])],
        tagsEx: [...(value.tagsEx ?? [])],
        sources: [...(value.sources ?? [])],
        states: [...(value.states ?? [])],
        lists: value.lists ? [...value.lists] : undefined,
        people: [...(value.people ?? [])],
        peopleEx: [...(value.peopleEx ?? [])],
        peopleAnd: value.peopleAnd ?? true,
        peopleExAnd: value.peopleExAnd ?? false
    };
}

function parseFilters(): MangaSearchFilter {
    const getArray = <T = string>(value: LocationQueryValue | LocationQueryValue[], func?: (v: string) => T, preserveCase = false): T[] => {
        const values =  Array.isArray(value)
            ? value.map(v => preserveCase ? v?.toString()! : v?.toString()?.toLowerCase()!).filter(t => !!t)
            : value ? [preserveCase ? value.toString() : value.toString().toLowerCase()!] : [];

        if (func) return values.map(func);
        return <any>values;
    }

    const getDate = (value: LocationQueryValue | LocationQueryValue[]): Date | undefined => {
        const str = Array.isArray(value) ? value[0]?.toString() : value?.toString();
        if (!str) return undefined;

        const date = new Date(str);
        return isNaN(date.getTime()) ? undefined : date;
    };

    const filter = {...defaultFilters.value};

    const pars: {
        [key: string]: {
            prop: keyof MangaSearchFilter,
            massage?: (value: LocationQueryValue | LocationQueryValue[]) => any
        }
    } = {
        'page': { prop: 'page', massage: (v) => +(v ?? 1) },
        'size': { prop: 'size', massage: (v) => +(v ?? 20) },
        'search': { prop: 'search' },
        'order': { prop: 'order', massage: (v) => +(v ?? defaultFilters.value.order!) },
        'asc': { prop: 'asc', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'ratings': { prop: 'ratings', massage: (v) => getArray(v, t => +t) },
        'tags': { prop: 'tags', massage: (v) => getArray(v) },
        'tagsex': { prop: 'tagsEx', massage: (v) => getArray(v) },
        'sources': { prop: 'sources', massage: (v) => getArray(v) },
        'tagsand': { prop: 'tagsAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'tagsexand': { prop: 'tagsExAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'people': { prop: 'people', massage: (v) => getArray(v, undefined, true) },
        'peopleex': { prop: 'peopleEx', massage: (v) => getArray(v, undefined, true) },
        'peopleand': { prop: 'peopleAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'peopleexand': { prop: 'peopleExAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'states': { prop: 'states', massage: (v) => getArray(v, t => +t) },
        'statesinclude': { prop: 'statesInclude', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'statesand': { prop: 'statesAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'chapmin': { prop: 'chapMin', massage: (v) => +(v ?? 0) },
        'chapmax': { prop: 'chapMax', massage: (v) => +(v ?? 0) },
        'mbefore': { prop: 'mBefore', massage: getDate },
        'mafter': { prop: 'mAfter', massage: getDate },
        'cfirstbefore': { prop: 'cFirstBefore', massage: getDate },
        'cfirstafter': { prop: 'cFirstAfter', massage: getDate },
        'clastbefore': { prop: 'cLastBefore', massage: getDate },
        'clastafter': { prop: 'cLastAfter', massage: getDate }
    };

    for(const key in route.query) {
        const param = pars[key.toLowerCase()];
        if (!param) continue;

        const value = route.query[key];
        if (!value) continue;

        filter[param.prop] = param.massage ? param.massage(value) : route.query[key];
    }

    if (props.state) {
        props.state.set(filter);
    }

    return normalizeFilters(filter);
}

const tRefresh = throttle<void>(() => {
    if (pending.value) return;
    refresh();
}, 250);

watch(() => route.query, () => tRefresh(), { deep: true });
watch(canRead, () => tRefresh());
</script>

<style lang="scss" scoped>
$bg-color: var(--bg-color-accent);
$br-color: transparent;

.search-drawer {
    margin: 5px auto;
    border-radius: var(--brd-radius);
    overflow: hidden;
    transition: background-color 250ms;

    .control {
        background-color: $bg-color;

        &.no-top { margin-top: 0; }
        a, button { padding: 0 5px; }
    }

    main {
        background-color: $bg-color;
        overflow: hidden;
        max-height: 0;
        transition: all 250ms;
        border-bottom-left-radius: var(--brd-radius);
        border-bottom-right-radius: var(--brd-radius);
        border-top: 1px solid transparent;
        padding: 0 10px;

        h2 { margin-top: 10px; }
        button:last-child { margin-bottom: var(--margin); }
    }

    &.open main {
        max-height: 80vh;
        border-top-color: $br-color;
        overflow-y: auto;
    }

    &.stuck { background-color: var(--bg-color-accent-dark); }
}

@media only screen and (max-width: 550px) {
    .control {
        label, select { display: none; }
    }
}
</style>
