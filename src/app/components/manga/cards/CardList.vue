<template>
    <div class="card-list" ref="scroller" @scroll="onScroll" :class="cssStyle">
        <div class="title flex center-items">
            <IconBtn
                icon="arrow_back"
                @click="back"
            />
            <h2 class="fill" :class="{ 'caps': isTrue(capitalize) }">{{ title }} ({{ manga.length }})</h2>

            <IconBtn
                v-if="isTrue(allowReload)"
                @click="() => $emit('reload')"
                icon="sync"
            />
            <IconBtn
                @click="() => fill = !fill"
                :icon="!fill ? 'fullscreen' : 'fullscreen_exit'"
            />
            <slot name="extra-buttons" />
            <IconBtn
                v-if="canPaginate"
                @click="() => infinite = !infinite"
                :icon="!infinite ? 'all_inclusive' : 'page_control'"
                title="Infinite Scroll / Pagination"
            />
            <div class="btn-group">
                <IconBtn
                    v-for="sty in styles"
                    @click="() => style = sty.style"
                    :icon="sty.icon"
                    :color="sty.style === listStyle ? 'primary' : 'shade'"
                />
            </div>
        </div>

        <header ref="stickyheader">
            <slot />
        </header>

        <div class="pager-wrapper" v-if="canPaginate && !infinite && (pagination?.total ?? 0) > 1">
            <Pager
                :page="pagination!.page"
                :pages="pagination!.pages"
                :size="pagination!.size"
                :total="pagination!.total"
                @load-page="(v) => emits('load-page', v)"
            />
        </div>

        <div class="loading-card" v-if="pending">
            <Loading />
        </div>

        <div v-else class="cards" :class="{ 'grid by-auto': listStyle === ListStyle.Album }">
            <div class="card" v-for="(item, index) in manga" :key="index">
                <Card
                    v-if="'entity' in item"
                    :manga="item"
                    :content-ratings="contentRatings"
                />
                <RISCard
                    v-else
                    :manga="item"
                    :content-ratings="contentRatings"
                />
            </div>
        </div>

        <div class="error-card " v-if="isTrue(noResults) && !manga?.length && !pending">
            <div class="flex fill-parent">
                <div class="center flex center-items">
                    <img src="/twirl.gif" alt="No results"/>
                    <p class="pad">No Results</p>
                </div>
            </div>
            
        </div>

        <div class="pager-wrapper margin-bottom" v-if="canPaginate && !infinite && !pending">
            <Pager
                :page="pagination!.page"
                :pages="pagination!.pages"
                :size="pagination!.size"
                :total="pagination!.total"
                @load-page="(v) => emits('load-page', v)"
                no-top-margin
            />
        </div>

    </div>
</template>

<script lang="ts" setup>
import { ListStyle } from '~/models';
import type {
    booleanish, EnumDescription,
    ImageSearchResultType, MbMangaProgress,
    MbTypeManga, MbTypeMangaSearch,
    ContentRating
} from '~/models';

const { listStyle, fillPage, infiniteScroll } = useAppSettings();
const { canRead } = useAuthHelper();
const { isTrue } = useUtils();
const progress = useProgressCacheHelper();

const stickyheader = ref<HTMLElement>();
const emits = defineEmits<{
    (e: 'onscrolled'): void;
    (e: 'reload'): void;
    (e: 'headerstuck', value: boolean): void;
    (e: 'load-page', value: number): void;
}>();

const scroller = ref<HTMLElement>();

const props = defineProps<{
    manga: (MbTypeManga | MbTypeMangaSearch | ImageSearchResultType)[],
    pending?: booleanish;
    noResults?: booleanish;
    capitalize?: booleanish;
    title: string;
    allowReload?: booleanish;
    pagination?: {
        page: number;
        pages: number;
        size: number;
        total: number;
    },
    contentRatings: EnumDescription<ContentRating>[];
}>();


const style = computed<ListStyle>({
    get: () => listStyle.value,
    set: (value: ListStyle) => listStyle.value = value
});

const fill = computed<boolean>({
    get: () => fillPage.value,
    set: (value: boolean) => fillPage.value = value
});

const infinite = computed<boolean>({
    get: () => infiniteScroll.value,
    set: (value: boolean) => infiniteScroll.value = value
});

const canPaginate = computed(() => !!props.pagination);
const cssStyle = computed(() => `${style.value} ${fill.value ? 'fill-page' : ''}`);

const styles = [
    { icon: 'list', style: ListStyle.Compact },
    { icon: 'expand', style: ListStyle.Expanded },
    { icon: 'book', style: ListStyle.Album }
]

const onScroll = () => {
    const element = scroller.value;
    if (!element) return;

    const bottom =
        element.scrollTop + element.clientHeight
        >= element.scrollHeight;
    if (!bottom) return;

    emits('onscrolled');
}

const back = () => history.back();

const loadProgress = async (key?: string) => {
    if (!canRead.value || !import.meta.client) return;

    const mids = [... new Set(props.manga.map(t => {
        if ('entity' in t) return t.entity.id;
        return t.closest?.entity.id!;
    }).filter(t => !!t))];

    if (!mids.length) return;

    progress.load(mids);
}

watch(() => props.manga, () => {
    loadProgress('props.manga');
}, { deep: true });

watch(canRead, () => loadProgress('canRead'));

onMounted(() => {
    const observer = new IntersectionObserver(
        ([e]) => {
            e!.target.toggleAttribute('stuck', e!.intersectionRatio < 1);
            emits('headerstuck', e!.intersectionRatio < 1);
        }, { threshold: 1 }
    );

    if (stickyheader.value)
        observer.observe(stickyheader.value);

    loadProgress('onMounted');
});

onUnmounted(() => {
    progress.clear();
});

</script>

<style lang="scss" scoped>
.card-list {
    position: relative;
    overflow-y: auto;
    width: 100%;
    max-height: 100%;
    padding: 0 var(--margin);

    .title, header, .cards, .error-card {
        max-width: min(98vw, 1050px);
        width: 100%;
        margin: 0 auto;
        margin-top: var(--margin);

        .btn-reload {
            height: 24px;
            margin: auto 10px;
        }

        .btn-group {
            margin-top: 0;
            border: 0;
            background-color: transparent;

            button {

                &:not(:first-child):not(:last-child) {
                    border-radius: 0;
                }

                &:first-child {
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                }

                &:last-child {
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }
            }
        }
    }

    .pager-wrapper {
        display: flex;
        max-width: min(98vw, 1050px);
        width: 100%;
        margin-left: auto;
        margin-right: auto;
    }

    .title {
        h2 {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: pre;

            &.caps { text-transform: capitalize; }
        }
    }

    header {
        position: sticky;
        top: -2px;
        z-index: 1;

        &[stuck] { padding-top: 5px; }
    }

    .cards {
        padding-bottom: var(--margin);
        margin-top: 0;

        .card:first-child {
            margin-top: 0;
        }
    }

    .error-card {
        display: flex;
        flex-flow: row;
        align-items: center;
        margin: auto;

        img { height: 80px; }
    }

    &.album {
        .cards {
            gap: .25rem;
            margin: 0 auto;

            .card {
                margin: 0 auto;
            }
        }
    }

    &.fill-page {
        .title, header, .cards, .error-card, .pager-wrapper { max-width: 100%; }
    }
}

@media only screen and (max-width: 900px) {
    .card-list.album .cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media only screen and (max-width: 600px) {
    .card-list.album .cards {
        grid-template-columns: repeat(1, minmax(0, 1fr));

        .card { margin: 0 auto !important; }
    }
}
</style>
