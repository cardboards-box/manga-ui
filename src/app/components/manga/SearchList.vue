<template>
    <div class="card-list" ref="scroller" @scroll="onScroll" :class="cssStyle">
        <div class="title flex center-items">
            <IconBtn
                icon="arrow_back"
                @click="back"
                v-if="showBack"
            />
            <h2 class="fill" :class="{ 'caps': isTrue(capitalize) }">{{ title }} ({{ items.length }})</h2>

            <IconBtn
                v-if="isTrue(allowReload)"
                @click="() => $emit('reload')"
                icon="sync"
            />
            <IconBtn
                @click="() => fill = !fill"
                :icon="!fill ? 'fullscreen' : 'fullscreen_exit'"
            />
            <IconBtn
                v-if="canPaginate"
                @click="() => infinite = !infinite"
                :icon="!infinite ? 'all_inclusive' : 'page_control'"
                title="Infinite Scroll / Pagination"
            />
            <slot name="extra-buttons" />
        </div>

        <header ref="stickyheader">
            <slot name="header" />
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

        <div class="error-card" v-else-if="error">
            <div class="flex fill-parent">
                <div class="center flex center-items">
                    <img src="/twirl.gif" alt="No results"/>
                    <p class="pad">{{ error }}</p>
                </div>
            </div>
        </div>

        <div v-else class="cards" :class="{ 'grid by-auto': shouldShowGrid }">
            <div class="card" v-for="(item, index) in items" :key="index">
                <slot :item="item" :index="index" />
            </div>
        </div>

        <div class="error-card " v-if="!items?.length && !pending">
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

<script lang="ts" setup generic="T">
import type { booleanish, StyleOptions } from '~/models';

const { isTrue, serStyles } = useUtils();
const { fillPage, infiniteScroll } = useAppSettings();

const stickyheader = ref<HTMLElement>();
const emits = defineEmits<{
    (e: 'onscrolled'): void;
    (e: 'reload'): void;
    (e: 'headerstuck', value: boolean): void;
    (e: 'load-page', value: number): void;
    (e: 'back'): void;
}>();

const scroller = ref<HTMLElement>();

const props = defineProps<{
    items: T[],
    pending?: booleanish;
    error?: string;
    capitalize?: booleanish;
    title: string;
    allowReload?: booleanish;
    hideBack?: booleanish;
    showGrid?: booleanish;
    styles?: StyleOptions;
    pagination?: {
        page: number;
        pages: number;
        size: number;
        total: number;
    };
}>();

const infinite = computed<boolean>({
    get: () => infiniteScroll.value,
    set: (value: boolean) => infiniteScroll.value = value
});

const shouldShowGrid = computed(() => isTrue(props.showGrid));

const fill = computed<boolean>({
    get: () => fillPage.value,
    set: (value: boolean) => fillPage.value = value
});

const style = computed(() => serStyles(props.styles));

const canPaginate = computed(() => !!props.pagination);
const cssStyle = computed(() => `${style.value} ${fill.value ? 'fill-page' : ''}`);
const showBack = computed(() => !isTrue(props.hideBack));

const onScroll = () => {
    const element = scroller.value;
    if (!element) return;

    const bottom =
        element.scrollTop + element.clientHeight
        >= element.scrollHeight;
    if (!bottom) return;

    emits('onscrolled');
}

const back = () => emits('back');

onMounted(() => {
    const observer = new IntersectionObserver(
        ([e]) => {
            e!.target.toggleAttribute('stuck', e!.intersectionRatio < 1);
            emits('headerstuck', e!.intersectionRatio < 1);
        }, { threshold: 1 }
    );

    if (stickyheader.value)
        observer.observe(stickyheader.value);
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
