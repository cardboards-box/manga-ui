<template>
    <Error v-if="error" :message="error"  />
    <CardList
        v-else
        :title="title"
        :manga="results"
        :pending="loading"
        @onscrolled="onScroll"
        @headerstuck="(v) => headerStuck = v"
        @reload="() => refresh()"
        @load-page="(v) => updateRoute({ page: v })"
        capitalize
        allow-reload
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

            <TagsFilter v-model="searchFilters" :tags="tags" :sources="sources" />

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

            <div class="flex row margin-top margin-bottom">
                <label>Minimum Chapter Count:</label>
                <input type="number" v-model="searchFilters.chapMin" />
            </div>

            <label>Manga Sources:</label>
            <ButtonGroup :options="srcs" v-model="searchFilters.sources" />

            <label>Content Ratings:</label>
            <ButtonGroup :options="contentRatings" v-model="searchFilters.ratings" />

            <label class="margin-top">Order By:</label>
            <ButtonGroupOne :options="mangaOrderBy" v-model="searchFilters.order" />

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
    </CardList>
</template>

<script setup lang="ts">
import type { LocationQueryValue } from 'vue-router';
import { MangaOrderBy, STATE_ROLLUP } from '~/models';
import type { MangaSearchFilter } from '~/models';

const api = useMangaApi();
const route = useRoute();
const router = useRouter();
const { canRead } = useAuthHelper();
const { addParams } = useSettingsHelper();
const { infiniteScroll, blackListTags } = useAppSettings();
const cache = useCacheHelper();
const { throttle } = useUtils();
const { searchManga } = useMangaUtils();

useHead({ title: 'Find your next binge!' });

if (import.meta.server) useSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
})

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
    states: [],
    statesInclude: true,
    statesAnd: false,
    chapMin: 0
} as const;

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
    async () => await searchManga(searchFilters.value),
    { watch: [() => route.query] }
);
const results = computed(() => (data.value ? api.data(data.value)?.data : []) ?? []);
const total = computed(() => (data.value ? api.data(data.value)?.total : 0));
const pages = computed(() => (data.value ? api.data(data.value)?.pages : 0));
const loading = computed(() => pending.value);
const error = computed({
    get: () => _error.value ?? rawError.value?.message,
    set: (value) => _error.value = value
});

const title = computed(() => route.params.type?.toString() ?? 'Search');

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

const srcs = computed(() => sources.value.map(t => ({ name: t.name, value: t.id, description: t.baseUrl })));

const onScroll = () => {
    if (results.value.length === 0 ||
        pages.value <= page.value||
        loading.value ||
        !infiniteScroll.value)
        return;

    page.value++;
}

const updateRoute = (merge?: Partial<MangaSearchFilter>) => {
    const fil = { ...filter.value, ...merge };

    const uri = STATE_ROLLUP.find(s => s.get(fil))!.routes;
    const url = addParams(uri, fil);
    router.push(url);
}

const clearFilters = () => {
    const curPage = page.value;
    const curSize = size.value;
    updateRoute({
        ...DEFAULT_FILTERS,
        page: curPage,
        size: curSize
    });
}

const doSearch = () => {
    updateRoute(searchFilters.value);
}

function parseFilters(): MangaSearchFilter {
    const getArray = <T = string>(value: LocationQueryValue | LocationQueryValue[], func?: (v: string) => T): T[] => {
        const values =  Array.isArray(value)
            ? value.map(v => v?.toString()?.toLowerCase()!).filter(t => !!t)
            : value ? [value.toString().toLowerCase()!] : [];

        if (func) return values.map(func);
        return <any>values;
    }

    const filter = {...DEFAULT_FILTERS};

    const pars: {
        [key: string]: {
            prop: keyof MangaSearchFilter,
            massage?: (value: LocationQueryValue | LocationQueryValue[]) => any
        }
    } = {
        'page': { prop: 'page', massage: (v) => +(v ?? 1) },
        'size': { prop: 'size', massage: (v) => +(v ?? 20) },
        'search': { prop: 'search' },
        'order': { prop: 'order', massage: (v) => +(v ?? MangaOrderBy.LastChapterCreatedAt) },
        'asc': { prop: 'asc', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'ratings': { prop: 'ratings', massage: (v) => getArray(v, t => +t) },
        'tags': { prop: 'tags', massage: (v) => getArray(v) },
        'tagsex': { prop: 'tagsEx', massage: (v) => getArray(v) },
        'sources': { prop: 'sources', massage: (v) => getArray(v) },
        'tagsand': { prop: 'tagsAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'tagsexand': { prop: 'tagsExAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'states': { prop: 'states', massage: (v) => getArray(v, t => +t) },
        'statesinclude': { prop: 'statesInclude', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'statesand': { prop: 'statesAnd', massage: (v) => v?.toString().toLocaleLowerCase() === 'true' },
        'chapmin': { prop: 'chapMin', massage: (v) => +(v ?? 0) }
    };

    for(const key in route.query) {
        const param = pars[key.toLowerCase()];
        if (!param) continue;

        const value = route.query[key];
        if (!value) continue;

        filter[param.prop] = param.massage ? param.massage(value) : route.query[key];
    }

    const path = route.fullPath.toLowerCase().split('?')[0]!;
    for(const state of STATE_ROLLUP) {
        if (state.routes !== path)
            continue;

        state.set(filter);
    }

    for(const tag of blackListTags?.value ?? []) {
        if (!filter.tagsEx?.includes(tag))
            filter.tagsEx = [...(filter.tagsEx ?? []), tag];
    }

    return filter;
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
