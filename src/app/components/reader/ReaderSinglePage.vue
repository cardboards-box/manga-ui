<template>
    <div 
        class="reader-single-page flex fill fill-parent" 
        ref="container"
    >
        <div 
            class="img-container center"
            :class="{
                'scrollable-x': imageSize.scrollX,
                'scrollable-y': imageSize.scrollY
            }"
            v-if="currentUrl"
        >
            <img 
                :src="currentUrl"
                :width="imageSize.width"
                :height="imageSize.height"
            />
        </div>
        <Loading v-else-if="currentState === 'loading'" />
        <Error v-else-if="currentState === 'inital'" message="Image not yet loaded... for some reason?" />
        <Error v-else :message="'Failed to load page'" />
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
    current: MbImage;
    open: boolean;
}>();

/** The container the image should be displayed in */
const container = ref<HTMLDivElement>();
/** Trigger for resizing the image */
const resizeTrigger = ref(true);
/** The observer for watching the container's size */
const resize = ref<ResizeObserver>();
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
.reader-single-page {
    overflow: hidden;

    .img-container {
        max-width: min(100%, 100vw);
        max-height: min(100%, 100vh);
        overflow: hidden;

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