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
                <Loading v-else-if="image.state === 'loading'" />
                <Error v-else-if="image.state === 'initial'" message="Image not yet loaded... for some reason?" />
                <Error v-else :message="'Failed to load page'" />
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
    current: MbImage;
    percentage: number;
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
.reader-long-strip {
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