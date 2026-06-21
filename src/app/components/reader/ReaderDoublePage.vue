<template>
    <div
        class="reader-double-page flex fill fill-parent"
        ref="container"
    >
        <div
            class="img-container center"
            :class="{
                'scrollable-x': spreadSize.scrollX,
                'scrollable-y': spreadSize.scrollY
            }"
        >
            <template v-for="page of spreadPages" :key="page.ordinal">
                <img
                    v-if="page.url"
                    :src="page.url"
                    :width="page.width"
                    :height="page.height"
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
    maxImageWidth
} = useAppSettings();

const props = defineProps<{
    images: PageImage[];
    current: MbImage;
    open: boolean;
    style: PageStyle;
}>();

/** The container the image spread should be displayed in */
const container = ref<HTMLDivElement>();
/** Trigger for resizing the image spread */
const resizeTrigger = ref(true);
/** The observer for watching the container's size */
const resize = ref<ResizeObserver>();
/** The page style for the reader */
const pageStyle = computed(() => props.style);
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

    return props.images.slice(currentIndex, currentIndex + 2);
});
/** The calculated dimensions and scroll state for the spread */
const spreadSize = computed(() => {
    resizeTrigger.value;

    const imageSizes = sourcePages.value.map(i => i.response?.image);
    const loadedSizes = imageSizes.filter((i): i is SizeR & { blob: Blob } => !!i);

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
    if (!container.value) return;

    resize.value = new ResizeObserver(onResize);
    resize.value.observe(container.value);
});

/** Cleans up the observer when the component is unmounted */
onUnmounted(() => {
    if (!container.value || !resize.value) return;

    resize.value.unobserve(container.value);
    resize.value.disconnect();
});
</script>

<style lang="scss" scoped>
.reader-double-page {
    overflow: hidden;

    .img-container {
        max-width: min(100%, 100vw);
        max-height: min(100%, 100vh);
        overflow: hidden;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        img {
            display: block;
            filter: var(--manga-filter);
        }

        &.scrollable-x {
            overflow-x: auto;
            justify-content: flex-start;
            margin-left: 0 !important;
            margin-right: 0 !important;
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
