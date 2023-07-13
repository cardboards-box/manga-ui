<template>
<CardList 
    :title="type" 
    :manga="results.results" 
    :pending="pending" 
    @onscrolled="onScroll" 
    @headerstuck="(v) => headerStuck = v"
    @reload="() => fetch(true)"
    capitalize
    allow-reload
>
    <InputGroup
        v-model="filter.search"
        placeholder="Search for your favourite manga!" 
        :stuck="headerStuck"
        :link="filterRouteUrl()"
    >
        <template #input>
            <select v-model="filter.state">
                <option 
                    v-for="state in states" 
                    :value="state.index"
                >
                    {{ state.text }}
                </option>
            </select>
            <label>({{ results.results.length }} / {{ results.count }})</label>
        </template>

        <h2>Advanced Search Options: </h2>
        <template v-if="!onlynhentai">
            <label>Tags</label>
            <ButtonGroupTags 
                v-model:on="filter.include" 
                v-model:off="filter.exclude" 
                :options="allTags" 
            />
        </template>
        <template v-if="hasnhentai">
            <label>NSFW Tags</label>
            <ButtonGroupTags 
                v-model:on="filter.include" 
                v-model:off="filter.exclude" 
                :options="nsfwTags" 
            />
        </template>

        <label>Sources</label>
        <ButtonGroup 
            v-model="filter.sources" 
            :options="sources" 
            capitalize 
        />

        <label>Content Rating</label>
        <ButtonGroup 
            v-model="filter.attributes[0].values" 
            :options="ratings" 
            capitalize 
        />
        <ButtonGroupBool 
            v-if="filter.attributes[0].values.length > 0" 
            v-model="filter.attributes[0].include" 
            on="Include" 
            off="Exclude" 
            on-icon="done" 
            off-icon="close" 
        />

        <label>Publication Status</label>
        <ButtonGroup 
            v-model="filter.attributes[2].values" 
            :options="statuses" 
            capitalize 
        />
        <ButtonGroupBool 
            v-if="filter.attributes[2].values.length > 0" 
            v-model="filter.attributes[2].include" 
            on="Include" 
            off="Exclude" 
            on-icon="done" 
            off-icon="close" 
        />

        <label>Sort Options</label>
        <ButtonGroupIndex 
            v-model="filter.sort" 
            :options="allSorts" 
        />
        <label>Sort By Options</label>
        <ButtonGroupBool v-model="filter.asc" />

        <button class="icon-btn align-left" @click="clearTags()">
            <Icon>delete</Icon>
            <p>Clear</p>
        </button>
    </InputGroup>
</CardList>
</template>

<script setup lang="ts">
import { Paginated, ProgressExt, Filter, AttributeType } from "~/models";

const advanced = ref(false);
const headerStuck = ref(false);
const route = useRoute();
const { search, filters: getFilters } = useMangaApi();
const { serialize, deserialize } = useFilterHelpter();

const states = [
    { text: 'All', routes: '/search/all', index: 0 },
    { text: 'Completed', routes: '/search/completed', index: 2 },
    { text: 'In Progress', routes: '/search/in-progress', index: 3, aliases: ['inprogress'] },
    { text: 'Bookmarked', routes: '/search/bookmarked', index: 4 },
    { text: 'Favourites', routes: '/search/favourites', index: 1, aliases: [] },
    { text: 'Not Touched', routes: '/search/not', index: 5, aliases: [] }
];

const defaultFilters = {
    search: '',
    include: [],
    exclude: [],
    sources: [],
    attributes: [
        {
            type: AttributeType.ContentRating,
            include: true,
            values: []
        }, {
            type: AttributeType.OriginalLanguage,
            include: true,
            values: []
        }, {
            type: AttributeType.Status,
            include: true,
            values: []
        }
    ],
    asc: false,
    sort: 2,
    nsfw: 2,
};

const DEFAULT_FILTER = <Filter>{
    page: 1,
    size: 20,
    state: 0,
    ...defaultFilters
};

const filter = ref({...DEFAULT_FILTER});
const results = ref(<Paginated<ProgressExt>>{ pages: 0, count: 0, results: [] });
const pending = ref(false);

const { data: filters } = await getFilters();
   
const allTags = computed(() => filters.value?.find(t => t.key === 'tag')?.values || []);
const nsfwTags = computed(() => filters.value?.find(t => t.key === 'nsfw-tag')?.values || []);
const allSorts = computed(() => filters.value?.find(t => t.key === 'sorts')?.values || []);
const sources = computed(() => filters.value?.find(t => t.key === 'source')?.values || []);
const ratings = computed(() => filters.value?.find(t => t.key === 'content rating')?.values || []);
const languages = computed(() => filters.value?.find(t => t.key === 'original language')?.values || []);
const statuses = computed(() => filters.value?.find(t => t.key === 'status')?.values || []);
const type = computed(() => route.params.type.toString());
const state = computed(() => {
    for(let item of states) {
        if (item.text.toLocaleLowerCase() === type.value) return item.index;
        if (item.routes.toLowerCase().indexOf(type.value) !== -1) return item.index;

        const aliases = item.aliases || [];
        if (aliases.indexOf(type.value) !== -1) return item.index;
    }

    return 0;
});

const hasnhentai = computed(() => filter.value.sources.includes('nhentai'));
const onlynhentai = computed(() => hasnhentai.value && filter.value.sources.length === 1);

useHead({ title: 'Find your next binge!' });
useServerSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
});

const routeFilter = () => {
    let outputFilter = {...filter.value};
    outputFilter.state = state.value;
    return deserialize(<any>route.query, outputFilter, defaultFilters);
}

const filterRouteUrl = () => {
    const query = serialize(filter.value, defaultFilters);
    const uri = states.find(t => t.index === filter.value.state)?.routes || '/search/all';
    return `${uri}?${query}`;
}

const fetch = async (reset: boolean) => {
    if (pending.value) return;

    if (reset){
        results.value.results = [];
        results.value.pages = 0;
        results.value.count = 0;
    }

    pending.value = true;
    const { data } = await search({...filter.value}, false);
    pending.value = false;
    if (!data.value) return;

    const unbound = {...data.value};

    results.value.pages = unbound?.pages;
    results.value.count = unbound?.count;
    results.value.results = [...results.value.results, ...unbound.results];
}

const onScroll = async () => {
    const curRes = results.value;
    if (!curRes || curRes.pages <= filter.value.page || pending.value) return;
    
    filter.value.page++;
    await fetch(false);
}

const clearTags = () => {
    filter.value.exclude = [];
    filter.value.include = [];
    filter.value.sources = [];
    filter.value.attributes.forEach(t => t.values = []);
    filter.value.sort = defaultFilters.sort;
    filter.value.nsfw = defaultFilters.nsfw;
    
}

onMounted(() => nextTick(() => {
    filter.value = routeFilter();
    fetch(true);
}));

watch(() => route.query, () => fetch(true));
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