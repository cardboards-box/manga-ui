<template>
    <div
        class="reader-double-page flex fill fill-parent"
        v-swipe
        @tap="pageClick"
        @swipe-left="swipe(false)"
        @swipe-right="swipe(true)"
        ref="container"
    >
        <div
            class="img-container center"
            :class="{
                'scrollable-x': spreadSize.scrollX,
                'scrollable-y': spreadSize.scrollY
            }"
            ref="imageContainer"
        >
            <template v-for="page of spreadPages" :key="page.ordinal">
                <img
                    v-if="page.url"
                    :src="page.url"
                    :width="page.width"
                    :height="page.height"
                    draggable="false"
                />
                <div
                    v-else
                    class="image-placeholder flex row"
                    :style="{
                        'min-width': `${page.width ?? placeholderWidth}px`,
                        'min-height': `${page.height ?? placeholderHeight}px`
                    }"
                >
                    <div class="center margin">
                        <Loading
                            v-if="page.state === 'loading'"
                            message="Image is loading..."
                        />
                        <Loading
                            v-else-if="page.state === 'initial'"
                            message="Image not yet loaded."
                        />
                        <Error
                            v-else
                            message="Failed to load page."
                        />
                    </div>
                </div>
            </template>
        </div>
        <ReaderProgressBar
            :pages="images"
            :current-ids="spreadPages.map(i => i.id)"
            :style="progressBar"
        />
    </div>
</template>

<script setup lang="ts">
import { PageStyle, type MbImage } from '~/models';

type Size = {
    width: number | undefined;
    height: number | undefined;
};

type SizeR = {
    width: number;
    height: number;
}

type SpreadPage = {
    id: string;
    ordinal: number;
    state: PageImage['state'];
    url: string | undefined;
    width: number | undefined;
    height: number | undefined;
};

const placeholderWidth = 300;
const placeholderHeight = 600;

const {
    maxImageHeight,
    maxImageWidth,
    invertControls,
    forwardOnly,
    progressBarStyle: progressBar,
    regionMargin,
    scrollAmount
} = useAppSettings();
const {
    chapter,
    findNext,
    findPrev
} = useReaderHelper();

const props = defineProps<{
    images: PageImage[];
    current: MbImage;
    open: boolean;
    style: PageStyle;
}>();

const emits = defineEmits<{
    (e: 'update:open', value: boolean): void;
}>();

/** The container the image spread should be displayed in */
const container = ref<HTMLDivElement>();
/** The full-width image scroll container */
const imageContainer = ref<HTMLDivElement>();
/** Trigger for resizing the image spread */
const resizeTrigger = ref(true);
/** The observer for watching the container's size */
const resize = ref<ResizeObserver>();
/** The page style for the reader */
const pageStyle = computed(() => props.style);
/** Whether the settings menu is open */
const menuOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emits('update:open', value)
});
/** The available space for the image spread */
const space = computed(() => {
    resizeTrigger.value;
    return {
        width: container.value ? container.value.clientWidth : document.body.clientWidth,
        height: container.value ? container.value.clientHeight : document.body.clientHeight
    };
});
/** The current and next page to display as a spread */
const sourcePages = computed(() => {
    const currentIndex = props.images.findIndex(i => i.image === props.current);
    if (currentIndex < 0) return [];

    const currentOrdinal = props.images[currentIndex]?.image.ordinal;
    const spreadStart = currentOrdinal !== undefined && currentOrdinal % 2 === 0
        ? Math.max(0, currentIndex - 1)
        : currentIndex;

    return props.images.slice(spreadStart, spreadStart + 2);
});
/** The calculated dimensions and scroll state for the spread */
const spreadSize = computed(() => {
    resizeTrigger.value;

    const imageSizes = sourcePages.value.map(i => i.response?.image);
    const loadedSizes = imageSizes.filter((i) => !!i);

    if (!loadedSizes.length) {
        return {
            pages: sourcePages.value.map(() => ({
                width: undefined,
                height: undefined
            })),
            scrollX: false,
            scrollY: false
        };
    }

    const normalizeSpreadHeight = pageStyle.value !== PageStyle.DoublePageNaturalSize;
    const normalizedHeight = Math.max(...loadedSizes.map(i => i.height));
    const basePages = imageSizes.map(i => {
        const size = i ?? {
            width: placeholderWidth,
            height: placeholderHeight
        };

        if (!normalizeSpreadHeight) {
            return {
                width: size.width,
                height: size.height
            };
        }

        return {
            width: size.width * (normalizedHeight / size.height),
            height: normalizedHeight
        };
    });
    const baseSpread = {
        width: basePages.reduce((sum, i) => sum + i.width, 0),
        height: Math.max(...basePages.map(i => i.height))
    };
    const spaceSize = space.value;
    const spaceSizeH = { width: undefined, height: spaceSize.height };
    const spaceSizeW = { width: spaceSize.width, height: undefined };
    const spaceSizeM = { width: maxImageWidth.value, height: maxImageHeight.value };

    let max: Size | undefined;
    let allowUpscale = false;

    if (pageStyle.value === PageStyle.DoublePageFitToHeight) {
        max = spaceSizeH;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.DoublePageFitToWidth) {
        max = spaceSizeW;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.DoublePageMaxSize) {
        max = spaceSizeM;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.DoublePage) {
        max = spaceSize;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.DoublePageNaturalSize) {
        max = undefined;
    }

    const bounds = boundRatio(baseSpread, max, {
        allowUpscale
    });
    const scale = baseSpread.width <= 0 ? 1 : bounds.width / baseSpread.width;
    const pages = basePages.map(i => ({
        width: Math.round(i.width * scale),
        height: Math.round(i.height * scale)
    }));

    return {
        pages,
        scrollX: bounds.width > spaceSize.width,
        scrollY: bounds.height > spaceSize.height
    };
});
/** The pages with their calculated dimensions and URLs */
const spreadPages = computed<SpreadPage[]>(() => {
    return sourcePages.value.map((i, index) => {
        const current = i.response?.image;
        const size = spreadSize.value.pages[index];

        return {
            id: i.image.id,
            ordinal: i.image.ordinal,
            state: i.state,
            url: current?.blob ? URL.createObjectURL(current.blob) : undefined,
            width: size?.width,
            height: size?.height
        };
    });
});

/** Triggers the image resize variable */
const onResize = () => {
    resizeTrigger.value = !resizeTrigger.value;
};

type ReaderRoute = { route: string; id?: string; page?: number };

/** Navigates to a reader route, preserving the target page when provided. */
const moveToRoute = (route: ReaderRoute) => {
    let next = `/${route.route}/${route.id}`;
    if (route.page) next += `?page=${route.page}`;
    navigateTo(next);
}

/** Finds the index of the left page in the currently visible spread. */
const spreadStartIndex = computed(() => {
    const firstVisibleId = sourcePages.value[0]?.image.id;
    return props.images.findIndex(i => i.image.id === firstVisibleId);
});

/** Finds the route for a page offset from the current spread, crossing chapters at the edges. */
const findPageOffset = (offset: number): ReaderRoute => {
    if (spreadStartIndex.value < 0)
        return offset > 0 ? findNext('page') : findPrev('page');

    const targetIndex = spreadStartIndex.value + offset;
    if (targetIndex >= props.images.length)
        return findNext('chapter');

    if (targetIndex < 0) {
        if (spreadStartIndex.value === 0)
            return findPrev('chapter');

        const firstPage = props.images[0]?.image;
        return firstPage && chapter.value?.id
            ? { route: 'chapter', id: chapter.value.id, page: firstPage.ordinal }
            : findPrev('chapter');
    }

    const targetPage = props.images[targetIndex]?.image;
    if (!targetPage || !chapter.value?.id)
        return offset > 0 ? findNext('page') : findPrev('page');

    return {
        route: 'chapter',
        id: chapter.value.id,
        page: targetPage.ordinal
    };
}

/** Moves to the next or previous spread, applying inverted controls when requested. */
const move = (forward: boolean, applyInvert: boolean = true) => {
    const next = () => findPageOffset(2);
    const prev = () => findPageOffset(-2);
    const goForward = applyInvert && invertControls.value ? prev : next;
    const goBack = applyInvert && invertControls.value ? next : prev;

    moveToRoute((forward ? goForward : goBack)());
}

/** Moves directly to the next or previous chapter. */
const moveChapter = (forward: boolean) => {
    moveToRoute(forward ? findNext('chapter') : findPrev('chapter'));
}

/** Handles horizontal swipe gestures as spread navigation. */
const swipe = (right: boolean) => {
    move(right, true);
}

/** Splits the viewport into center, edge, and corner click regions. */
const getClickRegions = (event: MouseEvent) => {
    const margin = regionMargin.value;
    const edge = (100 / 2) - (margin / 2);
    const x = event.clientX / window.innerWidth * 100;
    const y = event.clientY / window.innerHeight * 100;

    return {
        center: x > edge && x < 100 - edge && y > edge && y < 100 - edge,
        left: x <= edge,
        right: x >= 100 - edge,
        top: y <= edge,
        bottom: y >= 100 - edge
    };
}

/** Checks whether the current spread is taller than the visible reader area. */
const hasVerticalScroll = () => {
    const scroller = imageContainer.value;
    return !!scroller && spreadSize.value.scrollY && scroller.scrollHeight > scroller.clientHeight + 1;
}

/** Checks whether the current spread is scrolled to its top edge. */
const isAtScrollTop = () => {
    const scroller = imageContainer.value;
    return !scroller || scroller.scrollTop <= 1;
}

/** Checks whether the current spread is scrolled to its bottom edge. */
const isAtScrollBottom = () => {
    const scroller = imageContainer.value;
    if (!scroller) return true;

    return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
}

/** Smoothly scrolls the visible spread by the configured viewport percentage. */
const scrollVisiblePage = (up: boolean = false) => {
    const scroller = imageContainer.value;
    if (!scroller) return;

    scroller.scrollBy({
        top: (up ? -1 : 1) * scroller.clientHeight * (scrollAmount.value / 100),
        behavior: 'smooth'
    });
}

/** Handles reader taps by toggling settings, scrolling, or moving between spreads. */
const pageClick = (event: MouseEvent) => {
    const regions = getClickRegions(event);
    if (regions.center) {
        menuOpen.value = !menuOpen.value;
        return;
    }

    if (hasVerticalScroll()) {
        if (isAtScrollBottom()) {
            move(true, false);
            return;
        }

        scrollVisiblePage();
        return;
    }

    if (forwardOnly.value) {
        move(true, false);
        return;
    }

    const isBack = regions.left || (regions.top && !regions.right);
    const isForward = regions.right || (regions.bottom && !regions.left);

    if (isBack) {
        move(false);
        return;
    }

    if (isForward) {
        move(true);
    }
}

/** Handles arrow key navigation for scrollable and non-scrollable double-page spreads. */
const arrowKeyHandler = (ev: KeyboardEvent) => {
    const scrollable = hasVerticalScroll();

    switch(ev.key) {
        case 'ArrowLeft':
            if (scrollable) return;
            ev.preventDefault();
            move(false);
            return;
        case 'ArrowRight':
            if (scrollable) return;
            ev.preventDefault();
            move(true);
            return;
        case 'ArrowUp':
            ev.preventDefault();
            if (scrollable) {
                if (isAtScrollTop()) {
                    moveChapter(false);
                    return;
                }

                scrollVisiblePage(true);
                return;
            }

            move(false);
            return;
        case 'ArrowDown':
            ev.preventDefault();
            if (scrollable) {
                if (isAtScrollBottom()) {
                    moveChapter(true);
                    return;
                }

                scrollVisiblePage();
                return;
            }

            move(true);
            return;
    }
};

/**
 * Makes sure the image fits within the given max bounds while maintaining aspect ratio.
 * Max bounds always win so the image cannot overflow the available space.
 * @param size The original size of the image
 * @param max The optional max size of the image
 * @param options Optional behavior flags
 */
function boundRatio(
    size: SizeR,
    max?: Size,
    options?: {
        allowUpscale?: boolean;
    }
): SizeR {
    const allowUpscale = options?.allowUpscale === true;
    let scale = allowUpscale ? Number.POSITIVE_INFINITY : 1;

    if (max?.width !== undefined && max.width > 0) {
        scale = Math.min(scale, max.width / size.width);
    }

    if (max?.height !== undefined && max.height > 0) {
        scale = Math.min(scale, max.height / size.height);
    }

    if (!Number.isFinite(scale)) {
        scale = 1;
    }

    return {
        width: Math.round(size.width * scale),
        height: Math.round(size.height * scale),
    };
}

/** Sets the observer to watch the container's size */
onMounted(() => {
    window.addEventListener('keydown', arrowKeyHandler);

    if (!container.value) return;

    resize.value = new ResizeObserver(onResize);
    resize.value.observe(container.value);
});

/** Cleans up the observer when the component is unmounted */
onUnmounted(() => {
    window.removeEventListener('keydown', arrowKeyHandler);

    if (!container.value || !resize.value) return;

    resize.value.unobserve(container.value);
    resize.value.disconnect();
});
</script>

<style lang="scss" scoped>
.reader-double-page {
    overflow: hidden;
    touch-action: pan-y;
    user-select: none;

    .img-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        img {
            display: block;
            filter: var(--manga-filter);
            -webkit-user-drag: none;
            user-select: none;
            pointer-events: none;
        }

        &.scrollable-x {
            overflow-x: auto;
            justify-content: flex-start;
        }

        &.scrollable-y {
            overflow-y: auto;
            align-items: flex-start;
        }

        .image-placeholder {
            position: relative;
            min-width: 300px;
            min-height: 600px;

            &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: block;
                min-width: calc(100% - var(--margin));
                min-height: calc(100% - var(--margin));
                border: 1px dashed var(--color-muted);
                border-radius: var(--brd-radius);
            }
        }
    }
}
</style>
