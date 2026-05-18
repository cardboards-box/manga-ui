<template>
    <div class="restitcher flex row fill-parent">
        <div class="max-width margin-top flex">
            <h1 class="center-vert">Chapter Restitcher</h1>
            <p class="margin-left center-vert fill mute">
                {{ guideActive ? 'Active' : 'Inactive' }} - {{ guideY }}px
            </p>
            <IconBtn
                icon="sync"
                title="Refresh Chapters & Images"
                @click="init(true)"
                color="danger"
                class="center-vert"
                :loading="loading || !!error"
            />
            <IconBtn
                icon="replay"
                title="Reset Slices"
                @click="resetSlices"
                class="center-vert"
                :loading="loading || !!error"
            />
            <IconBtn
                icon="save"
                title="Save Slices"
                @click="save"
                class="center-vert"
                :disabled="slices.length < 1"
                :loading="loading || !!error"
            />
        </div>

        <div
            class="image-container scrollable-y"
            :class="{ 'scrollable-x': anyScrollX }"
            ref="imageContainer"
        >
            <Loading v-if="loading" />
            <Error v-else-if="error" :message="error" />
            <template
                v-for="(image, index) of boundImages"
                :key="image.image.image.id"
            >
                <img
                    v-if="image && image.url"
                    :id="`manga-image-${image.ordinal}`"
                    :src="image.url"
                    :width="image.width"
                    :height="image.height"
                    @click="$e => slice(index, image.image.image, $e)"
                />
                <div
                    v-else
                    class="image-placeholder flex row"
                    :id="`manga-image-${image.ordinal}`"
                    :style="{
                        'min-width': `min(${image.width ?? 0}px, 100%)`,
                        'min-height': `${image.height ?? 0}px`
                    }"
                >
                    <div class="center-horz margin-top">
                        <Loading
                            v-if="image.state === 'loading'"
                            message="Image is loading..."
                        />
                        <Loading
                            v-else-if="image.state === 'initial'"
                            message="Image not yet loaded."
                        />
                        <Error
                            v-else
                            message="Failed to load page."
                        />
                    </div>
                </div>
            </template>

            <div
                class="snip flex"
                v-for="slice in slices"
                :key="`${slice.imageIndex}-${slice.y}`"
                :style="{
                    top: `${slice.containerY}px`
                }"
            >
                <IconBtn
                    icon="delete"
                    title="Remove Slice"
                    color="danger"
                    inline
                    @click="unslice(slice)"
                />
            </div>

            <div
                class="guide"
                :style="{
                    top: guideY ? `${guideY}px` : '0',
                    display: guideActive ? 'block' : 'none'
                }"
            />
        </div>

    </div>
</template>

<script lang="ts" setup>
import type { MbTypeChapter, MbSlice, MbSlicedImage, MbImage } from '~/models';

type Slice = {
    imageIndex: number;
    image: MbImage;
    y: number;
    containerY: number;
}

type Size = {
    width: number | undefined;
    height: number | undefined;
};

type SizeR = {
    width: number;
    height: number;
}

const api = useMangaApi();
const { get } = useImageCache();
const { parallelForEach } = useUtils();
const { getRelateds } = useMangaUtils();

const props = defineProps<{
    chapter: string;
}>();

const _loading = ref(false);
const _error = ref<string>();
const chapter = ref<MbTypeChapter>();
const slices = ref<Slice[]>([]);
const _images = ref<PageImage[]>([]);
const guideY = ref<number>();
const guideActive = ref(false);
const imageContainer = ref<HTMLDivElement>();
const images = computed(() => _images.value.toSorted((a, b) => a.image.ordinal - b.image.ordinal));

const resizeTrigger = ref(true);
const resize = ref<ResizeObserver>();

const space = computed(() => {
    resizeTrigger.value;
    return {
        width: imageContainer.value ? imageContainer.value.clientWidth : document.body.clientWidth,
        height: imageContainer.value ? imageContainer.value.clientHeight : document.body.clientHeight
    };
});

const loading = computed(() => _loading.value);
const error = computed(() => {
    if (_error.value) return _error.value;
    if (_images.value.length === 0) return 'No images found for this chapter.';
    if (!chapter.value) return 'Chapter not found.';
    return undefined;
});

const boundImages = computed(() => {
    resizeTrigger.value;
    return images.value.map(i => {
        const current = i.response?.image;
        if (!current)
            return {
                image: i,
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
        const bounds = boundRatio(imageSize, undefined, {
            allowUpscale: false
        });

        return {
            ...bounds,
            image: i,
            url: URL.createObjectURL(current.blob),
            scrollX: bounds.width > spaceSize.width,
            scrollY: bounds.height > spaceSize.height,
            state: i.state,
            ordinal: i.image.ordinal
        };
    });
});
const anyScrollX = computed(() => boundImages.value.some(i => i.scrollX));

function resetSlices() {
    slices.value = [];
}

async function loadImage(image: PageImage) {
    if (image.state !== 'initial') return;

    image.state = 'loading';
    try {
        image.response = await get(image.image);
        image.state = 'loaded';
    } catch (error) {
        image.state = 'error';
        console.error(`Failed to load image ${image.image.id}`, {
            image,
            error
        });
    } finally {
        _images.value = [..._images.value];
    }
}

async function loadImages() {
    if (!chapter.value) return;

    const images = getRelateds(chapter.value, 'MbImage');
    _images.value = images.map(image => ({
        image,
        state: 'initial' as const
    }));

    await parallelForEach(_images.value, image => loadImage(image), {
        maxDegreesOfParallelism: 5,
    });
}

async function init(force: boolean) {
    if (!props.chapter) return;

    const id = props.chapter;
    if (props.chapter === chapter.value?.entity.id && !force)
        return;

    _loading.value = true;
    _error.value = undefined;

    try {
        const result = await api.promise.chapter.fetch(id);
        if (!api.isSuccess(result)) {
            _error.value = api.errorMessage(result) ?? 'An error occurred!';
            return;
        }

        chapter.value = api.data(result);
    } catch (error) {
        _error.value = error?.toString() ?? 'An error occurred while loading the chapter.';
    } finally {
        _loading.value = false;
    }

    loadImages();
}

function onResize() {
    resizeTrigger.value = !resizeTrigger.value;
}

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

function slice(index: number, image: MbImage, event: MouseEvent) {
    if (!imageContainer.value) return;

    const container = imageContainer.value;
    const elementRect = (<HTMLDivElement>event.target).getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offsetY = elementRect.top - containerRect.top + container.scrollTop;

    const slice = {
        imageIndex: index,
        y: event.offsetY,
        containerY: offsetY + event.offsetY,
        image
    }
    slices.value = [
        ...slices.value,
        slice
    ]
}

function unslice(slice: Slice) {
    slices.value = slices.value.filter(s => s !== slice);
}

function onMouseEnter() {
    guideActive.value = true;
}

function onMouseLeave() {
    guideActive.value = false;
}

function onMouseMove(event: MouseEvent) {
    if (!imageContainer.value) return;

    const rect = imageContainer.value.getBoundingClientRect();
    const y = event.clientY - rect.top + imageContainer.value.scrollTop;
    guideY.value = y;
}

function between<T>(array: T[], from: number, to: number): T[] {
    const output = [];
    for(let i = from; i < to; i++) {
        output.push(array[i]!);
    }
    return output;
}

function generateSlices() {
    if (!chapter.value || !slices.value.length || !imageContainer.value) return [];

    const container = imageContainer.value;
    const outputs: MbSlicedImage[] = [];

    const orderedSlices = slices.value.toSorted((a, b) => a.containerY - b.containerY);
    const images = boundImages.value;

    const lastSlice = orderedSlices[orderedSlices.length - 1]!;
    const lastImage = images[images.length - 1]!;
    if (lastSlice.imageIndex !== images.length - 1 || lastSlice.y < (lastImage.height ?? 0)) {
        orderedSlices.push({
            imageIndex: images.length - 1,
            y: lastImage.height ?? 0,
            containerY: container.scrollHeight,
            image: lastImage.image.image
        });
    }

    let lastImageIndex = 0;
    for(const slice of orderedSlices) {
        const currentIndex = slice.imageIndex;
        if (currentIndex === lastImageIndex) {
            let start = 0;
            if (outputs.length > 0) {
                const last = outputs[outputs.length - 1]!;
                const lastSlice = last.slices[last.slices.length - 1]!;
                start = lastSlice.endY;
            }

            outputs.push({
                ordinal: outputs.length,
                slices: [{
                    ordinal: 1,
                    imageId: slice.image.id,
                    startY: start,
                    endY: slice.y
                }]
            });
            continue;
        }

        const sections: MbSlice[] = [];

        let start = 0;
        const last = outputs[outputs.length - 1];
        if (last) {
            const lastSlice = last.slices[last.slices.length - 1]!;
            start = lastSlice.endY;
        }

        const imageBefore = between(images, lastImageIndex, currentIndex);
        for(const image of imageBefore) {
            sections.push({
                ordinal: sections.length,
                imageId: image.image.image.id,
                startY: start,
                endY: image.height ?? 0
            });
            start = 0;
        }

        sections.push({
            ordinal: sections.length,
            imageId: slice.image.id,
            startY: start,
            endY: slice.y
        });

        outputs.push({
            ordinal: outputs.length,
            slices: sections
        });
        lastImageIndex = currentIndex;
    }

    return outputs;
}

async function save() {
    const slices = generateSlices();
    if (!chapter.value || !slices.length) return;

    _loading.value = true;
    _error.value = undefined;

    try {
        const result = await api.promise.chapter.restitch(chapter.value.entity.id, slices);
        if (!api.isSuccess(result)) {
            _error.value = api.errorMessage(result) ?? 'An error occurred!';
            return;
        }

        const newChapter = api.data(result);
        console.log('Restitch successful, new chapter:', newChapter);
        navigateTo(`/chapter/${newChapter.entity.id}`);
    } catch (error) {
        _error.value = error?.toString() ?? 'An error occurred while saving the slices.';
    } finally {
        _loading.value = false;
    }
}

watch(() => props.chapter, () => init(false), { immediate: true });

onMounted(() => {
    if (!imageContainer.value) {
        console.error('Image container not found for restitcher!');
        return;
    }

    console.log('Setting up resize observer');
    resize.value = new ResizeObserver(onResize);
    resize.value.observe(imageContainer.value);

    imageContainer.value.addEventListener('mouseenter', onMouseEnter);
    imageContainer.value.addEventListener('mouseleave', onMouseLeave);
    imageContainer.value.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
    if (!imageContainer.value) return;
    console.log('Tearing down resize observer');

    if (resize.value) {
        resize.value.unobserve(imageContainer.value);
        resize.value.disconnect();
    }

    imageContainer.value.removeEventListener('mouseenter', onMouseEnter);
    imageContainer.value.removeEventListener('mouseleave', onMouseLeave);
    imageContainer.value.removeEventListener('mousemove', onMouseMove);
})

</script>

<style lang="scss" scoped>
.restitcher {
    .image-container {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: url('/snip.svg') 12 12, auto;

        &.scrollable-x {
            overflow-x: auto;
            margin-left: 0 !important;
            margin-right: 0 !important;
        }

        &.scrollable-y {
            overflow-y: auto;
        }

        .image-placeholder {
            padding-top: calc(var(--margin) * 4);
            min-height: 100vh !important;
            min-width: 300px;

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

        .guide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 1px;
            background-color: var(--color-primary);
            pointer-events: none;
        }

        .snip {
            position: absolute;
            left: 0;
            transform: translateY(-50%);
            width: 100%;

            &::before {
                content: '';
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                left: 0;
                width: 100%;
                height: 1px;
                background-color: var(--color-muted);
            }
        }
    }

}
</style>
