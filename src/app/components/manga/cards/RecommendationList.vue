<template>
    <Loading v-if="pending" />
    <Error v-else-if="error" :message="error" />
    <CardList
        v-else
        :title="title ?? 'Here are some manga based on your read-history!'"
        :manga="manga"
        capitalize
        allow-reload
        @reload="() => refresh()"
        :content-ratings="contentRatings"
    >
        <template #extra-buttons>
            <IconBtn
                :icon="showFilter ? 'filter_alt_off' : 'filter_alt'"
                @click="() => showFilter = !showFilter"
            />
        </template>

        <div class="flex row filter-drawer" v-if="showFilter">

            <TagsFilter
                v-model="searchFilters"
                :tags="tags"
                :sources="sources"
                :filtered-sources="allSources"
                hide-mode
            />


            <label>Content Ratings:</label>
            <ButtonGroup :options="contentRatings" v-model="searchFilters.ratings" />

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
        </div>
    </CardList>
</template>

<script lang="ts" setup>
import type { RecommendationFilter } from '~/models';

const api = useMangaApi();
const cache = useCacheHelper();
const { recommendations } = useMangaUtils();
const { addParams } = useSettingsHelper();

const props = defineProps<{
    id?: string;
    title?: string;
}>();

const key = computed(() => `recommendations-${props.id ?? 'personal'}`);

const _showFilter = ref(false);
const showFilter = computed({
    get: () => _showFilter.value,
    set: (v) => {
        _showFilter.value = v;
        localStorage.setItem(key.value + '-show-filter', v.toString());
    }
});

const filters = ref<RecommendationFilter>({
    size: 20
});
const searchFilters = ref({...filters.value });

const {
    pending,
    data: apiData,
    error: apiError,
    refresh
} = useAsyncData(
    () => key.value,
    async () => await recommendations(props.id, filters.value),
    { watch: [() => props.id] }
);
const { data: cached } = useAsyncData(async () => await cache.get());
const tags = computed(() => cached.value?.tags ?? []);
const sources = computed(() => cached.value?.sources ?? []);
const contentRatings = computed(() => cached.value?.contentRatings ?? []);
const allSources = computed(() => sources.value.map(s => s.id));

const error = computed(() => {
    if (api.isSuccess(apiData.value)) return undefined;
    if (apiError.value) return api.errorMessage(<any>apiError.value.data);
    return api.errorMessage(apiData.value) ?? 'An unknown error occurred!';
});

const manga = computed(() => apiData.value ? api.data(apiData.value) ?? [] : []);

const doSearch = () => {
    filters.value = { ...searchFilters.value };
    refresh();
};

const clearFilters = () => {
    searchFilters.value = {
        size: 20
    };
    filters.value = { ...searchFilters.value };
    refresh();
};

onMounted(() => nextTick(() => {
    const showFilterStorage = localStorage.getItem(key.value + '-show-filter');
    if (showFilterStorage) _showFilter.value = showFilterStorage === 'true';
}));
</script>

<style lang="scss" scoped>
.filter-drawer {
    padding: var(--margin);
    background-color: var(--bg-color-accent);
    border-radius: calc(var(--brd-radius) * 2);
}
</style>
