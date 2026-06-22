<template>
    <div
        class="reader-single-page flex fill fill-parent"
        v-swipe
        @tap="pageClick"
        @swipe-left="swipe(true)"
        @swipe-right="swipe(false)"
        ref="container"
    >
        <div
            class="img-container center"
            :class="{
                'scrollable-x': imageSize.scrollX,
                'scrollable-y': imageSize.scrollY
            }"
            ref="imageContainer"
            v-if="currentUrl"
        >
            <img
                :src="currentUrl"
                :width="imageSize.width"
                :height="imageSize.height"
                draggable="false"
            />
        </div>
        <Loading v-else-if="currentState === 'loading'" />
        <Error v-else-if="currentState === 'inital'" message="Image not yet loaded... for some reason?" />
        <Error v-else :message="'Failed to load page'" />
        <ReaderProgressBar
            :pages="images"
            :current-ids="currentPage ? [currentPage.image.id] : []"
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

/** The container the image should be displayed in */
const container = ref<HTMLDivElement>();
/** The full-width image scroll container */
const imageContainer = ref<HTMLDivElement>();
/** Trigger for resizing the image */
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
/** The current page to display */
const currentPage = computed(() => props.images.find(i => i.image === props.current));
/** The current state of the image to currently display */
const currentState = computed(() => currentPage.value?.state ?? 'inital');
/** The URL of the current image */
const currentUrl = computed(() => currentPage.value?.response?.image?.blob
    ? URL.createObjectURL(currentPage.value.response.image?.blob)
    : undefined);
/** The available space for the image */
const space = computed(() => {
    resizeTrigger.value;
    return {
        width: container.value ? container.value.clientWidth : document.body.clientWidth,
        height: container.value ? container.value.clientHeight : document.body.clientHeight
    };
});

/** The size of the image to display based on settings */
const imageSize = computed(() => {
    resizeTrigger.value;

    if (!currentPage.value?.response?.image)
        return {
            width: undefined,
            height: undefined,
            scrollX: false,
            scrollY: false
        };
    const imageSize = currentPage.value.response.image;
    const spaceSize = space.value;
    const spaceSizeH = { width: undefined, height: spaceSize.height };
    const spaceSizeW = { width: spaceSize.width, height: undefined };
    const spaceSizeM = { width: maxImageWidth.value, height: maxImageHeight.value };

    let max: Size | undefined;
    let allowUpscale = false;

    if (pageStyle.value === PageStyle.SinglePageFitToHeight) {
        max = spaceSizeH;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.SinglePageFitToWidth) {
        max = spaceSizeW;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.SinglePageMaxSize) {
        max = spaceSizeM;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.SinglePageFit) {
        max = spaceSize;
        allowUpscale = true;
    } else if (pageStyle.value === PageStyle.SinglePageNaturalSize) {
        max = undefined;
    }

    const bounds = boundRatio(imageSize, max, {
        allowUpscale
    });

    return {
        ...bounds,
        scrollX: bounds.width > spaceSize.width,
        scrollY: bounds.height > spaceSize.height
    };
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

/** Moves to the next or previous page, applying inverted controls when requested. */
const move = (forward: boolean, applyInvert: boolean = true) => {
    const next = () => findNext('page');
    const prev = () => findPrev('page');
    const goForward = applyInvert && invertControls.value ? prev : next;
    const goBack = applyInvert && invertControls.value ? next : prev;

    moveToRoute((forward ? goForward : goBack)());
}

/** Handles horizontal swipe gestures as page navigation. */
const swipe = (right: boolean) => {
    move(right, true);
}

/** Splits the reader container into center, edge, and corner click regions. */
const getClickRegions = (event: MouseEvent) => {
    const margin = regionMargin.value;
    const edge = (100 / 2) - (margin / 2);
    const rect = container.value?.getBoundingClientRect();
    const width = rect?.width || window.innerWidth;
    const height = rect?.height || window.innerHeight;
    const x = ((event.clientX - (rect?.left ?? 0)) / width) * 100;
    const y = ((event.clientY - (rect?.top ?? 0)) / height) * 100;

    return {
        center: x >= edge && x <= 100 - edge && y >= edge && y <= 100 - edge,
        left: x <= edge,
        right: x >= 100 - edge,
        top: y <= edge,
        bottom: y >= 100 - edge
    };
}

/** Checks whether the current page is taller than the visible reader area. */
const hasVerticalScroll = () => {
    const scroller = imageContainer.value;
    return !!scroller && imageSize.value.scrollY && scroller.scrollHeight > scroller.clientHeight + 1;
}

/** Checks whether the current page is scrolled to its top edge. */
const isAtScrollTop = () => {
    const scroller = imageContainer.value;
    return !scroller || scroller.scrollTop <= 1;
}

/** Checks whether the current page is scrolled to its bottom edge. */
const isAtScrollBottom = () => {
    const scroller = imageContainer.value;
    if (!scroller) return true;

    return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
}

/** Smoothly scrolls the visible page by the configured viewport percentage. */
const scrollVisiblePage = (up: boolean = false) => {
    const scroller = imageContainer.value;
    if (!scroller) return;

    scroller.scrollBy({
        top: (up ? -1 : 1) * scroller.clientHeight * (scrollAmount.value / 100),
        behavior: 'smooth'
    });
}

/** Handles reader taps by toggling settings, scrolling, or moving between pages. */
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

/** Handles arrow key navigation for scrollable and non-scrollable single pages. */
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
                    move(false);
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
                    move(true);
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
.reader-single-page {
    overflow: hidden;
    touch-action: pan-y;
    user-select: none;

    .img-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
            filter: var(--manga-filter);
            -webkit-user-drag: none;
            user-select: none;
            pointer-events: none;
        }

        &.scrollable-x {
            overflow-x: auto;
        }

        &.scrollable-y {
            overflow-y: auto;
            align-items: flex-start;
        }
    }
}
</style>
