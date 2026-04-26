<template>
    <div 
        class="reader-long-strip flex fill fill-parent" 
        ref="container"
    >
        <div 
            class="img-container center scrollable-y"
            :class="{ 'scrollable-x': anyScrollX }"
            ref="imageContainer"
        >
            <template 
                v-for="image of boundImages"
            >
                <img 
                    v-if="image && image.url"
                    :id="`manga-image-${image.ordinal}`"
                    :src="image.url"
                    :width="image.width"
                    :height="image.height"
                />
                <Loading 
                    v-else-if="image.state === 'loading'"
                    :id="`manga-image-${image.ordinal}`" 
                    message="Image is loading..."
                />
                <Loading 
                    v-else-if="image.state === 'initial'" 
                    :id="`manga-image-${image.ordinal}`" 
                    message="Image not yet loaded." 
                />
                <Error 
                    v-else 
                    :id="`manga-image-${image.ordinal}`" 
                    message="Failed to load page." 
                />
            </template>
        </div>
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
    pageStyle,
    maxImageHeight,
    maxImageWidth
} = useAppSettings();

const props = defineProps<{
    images: PageImage[];
    open: boolean;
    current: MbImage | undefined;
    percentage: number;
    tagPage: number;
}>();

const emits = defineEmits<{
    (e: 'update:current', value: MbImage | undefined): void;
    (e: 'update:percentage', value: number | undefined): void;
}>();

/** The container the image should be displayed in */
const container = ref<HTMLDivElement>();
/** The container for the images */
const imageContainer = ref<HTMLDivElement>();
/** Trigger for resizing the image */
const resizeTrigger = ref(true);
/** Whether or not the initial scroll has been performed */
const didInitialScroll = ref(false);
/** The observer for watching the container's size */
const resize = ref<ResizeObserver>();
/** The available space for the image */
const space = computed(() => {
    resizeTrigger.value;
    return {
        width: container.value ? container.value.clientWidth : document.body.clientWidth,
        height: container.value ? container.value.clientHeight : document.body.clientHeight
    };
});
/** The current page to display */
const currentPage = computed({
    get: () => props.images.find(i => i.image === props.current),
    set: (value) => emits('update:current', value?.image)
});
/** The current percentage indicating how far through the chapter the user is */
const currentPercentage = computed({
    get: () => props.percentage,
    set: (value) => emits('update:percentage', value)
});

/** All of the images with their calculated bounds */
const boundImages = computed(() => {
    resizeTrigger.value;
    return props.images.map(i => {
        const current = i.response?.image;
        if (!current) 
            return { 
                state: i.state,
                url: undefined,
                width: undefined, 
                height: undefined,
                scrollX: false,
                scrollY: false,
                ordinal: i.image.ordinal
            };
        
        const imageSize = current;
        const spaceSize = space.value;
        const spaceSizeW = { width: spaceSize.width, height: undefined };
        const spaceSizeM = { width: maxImageWidth.value, height: maxImageHeight.value };

        let max: Size | undefined;
        let allowUpscale = false;

        if (pageStyle.value === PageStyle.LongStrip) {
            max = spaceSizeW;
            allowUpscale = true;
        } else if (pageStyle.value === PageStyle.LongStripMaxSize) {
            max = spaceSizeM;
            allowUpscale = true;
        } else if (pageStyle.value === PageStyle.LongStripNaturalSize) {
            max = undefined;
            allowUpscale = false;
        } else if (pageStyle.value === PageStyle.LongStripFit) {
            max = spaceSizeW;
        }
        
        const bounds = boundRatio(imageSize, max, {
            allowUpscale
        });

        return {
            ...bounds,
            url: URL.createObjectURL(current.blob),
            scrollX: bounds.width > spaceSize.width,
            scrollY: bounds.height > spaceSize.height,
            state: i.state,
            ordinal: i.image.ordinal
        };
    });
});

/** Whether any of the images require horizontal scrolling */
const anyScrollX = computed(() => boundImages.value.some(i => i.scrollX));

/** Triggers the image resize variable */
const onResize = () => {
    resizeTrigger.value = !resizeTrigger.value;
};

/** Gets the image ordinal with the largest visible area in the scroll container. */
function getCurrentVisibleOrdinal(): { ordinal: number, percent: number } | undefined {
    const scroller = imageContainer.value;
    if (!scroller) return undefined;

    const imageElements = Array.from(
        scroller.querySelectorAll<HTMLElement>('[id^="manga-image-"]'));
    if (!imageElements.length) return undefined;

    const viewport = scroller.getBoundingClientRect();

    let closestOrdinal: number | undefined;
    let closestElement: HTMLElement | undefined;
    let largestVisibleArea = -1;

    for (const element of imageElements) {
        const ordinalRaw = element.id.replace('manga-image-', '');
        const ordinal = Number.parseInt(ordinalRaw, 10);
        if (!Number.isFinite(ordinal)) continue;

        const rect = element.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(rect.right, viewport.right) - Math.max(rect.left, viewport.left));
        const overlapHeight = Math.max(0, Math.min(rect.bottom, viewport.bottom) - Math.max(rect.top, viewport.top));
        const visibleArea = overlapWidth * overlapHeight;

        if (visibleArea > largestVisibleArea) {
            largestVisibleArea = visibleArea;
            closestOrdinal = ordinal;
            closestElement = element;
        }
    }

    if (closestOrdinal === undefined || !closestElement) return undefined;

    const imageHeight = closestElement.offsetHeight;
    const imageTop = closestElement.offsetTop;
    const percent = imageHeight <= 0
        ? 0
        : Math.min(100, Math.max(0, 
            ((scroller.scrollTop - imageTop) / imageHeight) * 100));

    return {
        ordinal: closestOrdinal,
        percent,
    };
}

/** Updates current page + percentage from an image ordinal. */
function updateProgressFromOrdinal(ordinal: number): void {
    const index = props.images.findIndex(i => i.image.ordinal === ordinal);
    if (index < 0) return;

    const page = props.images[index];
    if (!page) return;

    if (currentPage.value?.image.id !== page.image.id)
        currentPage.value = page;
}

/** Updates percentage from the currently most visible image ordinal. */
function updatePercentageFromOrdinal(ordinal: number, percent: number): void {
    const index = props.images.findIndex(i => i.image.ordinal === ordinal);
    if (index < 0) {
        currentPercentage.value = 0;
        return;
    }

    const totalPages = props.images.length;
    const totalPercent = ((index + (percent / 100)) / totalPages) * 100;

    if (currentPercentage.value !== totalPercent)
        currentPercentage.value = totalPercent;
}

/** Syncs current page/progress from the user's scroll position. */
function syncProgressFromScroll(): void {
    const visibleImage = getCurrentVisibleOrdinal();
    if (visibleImage === undefined) return;

    updateProgressFromOrdinal(visibleImage.ordinal);
    updatePercentageFromOrdinal(visibleImage.ordinal, visibleImage.percent);
}

/** Scrolls to the current page image if it exists in the DOM. */
function scrollToCurrentPage(): boolean {
    const scroller = imageContainer.value;
    const currentOrdinal = currentPage.value?.image.ordinal;

    if (!scroller || currentOrdinal === undefined) return false;

    const target = scroller.querySelector<HTMLElement>(`#manga-image-${currentOrdinal}`);
    if (!target) return false;

    scroller.scrollTo({
        top: target.offsetTop,
        behavior: 'auto'
    });

    updateProgressFromOrdinal(currentOrdinal);
    setTimeout(() => syncProgressFromScroll(), 100);
    return true;
}

/** The event handler for the image container's scroll event */
const onImageContainerScroll = () => {
    syncProgressFromScroll();
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

watch(() => props.tagPage, () => scrollToCurrentPage());

/** Sets the observer to watch the container's size */
onMounted(() => {
    if (container.value) {
        resize.value = new ResizeObserver(onResize);
        resize.value.observe(container.value);
    }

    if (imageContainer.value) {
        imageContainer.value.addEventListener('scroll', onImageContainerScroll, { passive: true });
    }

    setTimeout(() => nextTick(() => {
        syncProgressFromScroll();

        if (!didInitialScroll.value) {
            didInitialScroll.value = scrollToCurrentPage();
        }
    }), 100);
});

/** Cleans up the observer when the component is unmounted */
onUnmounted(() => {
    if (imageContainer.value) {
        imageContainer.value.removeEventListener('scroll', onImageContainerScroll);
    }

    if (container.value && resize.value) {
        resize.value.unobserve(container.value);
        resize.value.disconnect();
    }
});
</script>

<style lang="scss" scoped>
.reader-long-strip {
    overflow: hidden;

    .img-container {
        max-width: min(100%, 100vw);
        max-height: min(100%, 100vh);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        img {
            filter: var(--manga-filter);
        }

        &.scrollable-x {
            overflow-x: auto;
            margin-left: 0 !important;
            margin-right: 0 !important;
        }

        &.scrollable-y {
            overflow-y: auto;
        }
    }
}
</style>