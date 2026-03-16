<template>
    <Error v-if="error" :message="error" />
    <ListList
        v-else
        :title="title"
        :lists="data"
         v-model="headerStuck"
        @onscrolled="onScroll"
        @reload="() => refresh()"
        @load-page="(v) => updateRoute({ page: v })"
        @back="back"
        :pagination="{
            page: page,
            pages: pages,
            size: size,
            total: total
        }"
    >
        <InputGroup
            v-model="searchFilters.search"
            placeholder="Search for a list!"
            :stuck="headerStuck"
            @search="() => doSearch()"
            is-drawer
        >
            <template #input>
                <label>({{ data.length }} / {{ total }})</label>
            </template>

            <h3 class="margin-bottom">Advanced Search Options:</h3>

            <label class="margin-top">Order By:</label>
            <ButtonGroupOne :options="order" v-model="searchFilters.order" />

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
    </ListList>
</template>

<script lang="ts" setup>
import { ListType } from '~/models';

const route = useRoute();
const { canRead } = useAuthHelper();
const { throttle } = useUtils();
const { infiniteScroll } = useAppSettings();
const cache = useCacheHelper();
const { search, parseFilters, updateRoute, clearFilters } = useListHelper();

const props = defineProps<{
    type: ListType
}>();

useHead({ title: 'Find your next binge!' });

if (import.meta.server) useSeoMeta({
    title: 'Find your next binge!',
    ogTitle: 'Find your next binge!',
    description: 'Find your next binge on MangaBox!',
    ogDescription: 'Find your next binge on MangaBox!',
    ogImage: 'https://manga.index-0.com/logo.png'
})

const { data: cached } = useAsyncData(async () => await cache.get());
const order = computed(() => cached.value?.listOrderBy ?? []);

const title = computed(() => props.type === ListType.Public ? 'Public Lists' : 'My Lists');
const searchFilters = ref(parseFilters(props.type));
const {
    refresh,
    pending, data, error: rawError,
    pages, page, size, total
} = search(props.type);

const headerStuck = ref(false);
const _error = ref<string>();
const loading = computed(() => pending.value);
const error = computed({
    get: () => _error.value ?? rawError.value,
    set: (value) => _error.value = value
});

const back = () => history.back();

const onScroll = () => {
    if (data.value.length === 0 ||
        pages.value <= page.value||
        loading.value ||
        !infiniteScroll.value)
        return;

    page.value++;
}

const doSearch = () => {
    updateRoute(searchFilters.value);
}

const tRefresh = throttle<void>(() => {
    if (pending.value) return;
    refresh();
}, 250);

watch(() => route.query, () => tRefresh(), { deep: true });
watch(canRead, () => tRefresh());
</script>

