<template>
    <Error v-if="error" :message="error" />
    <div
        class="manga-reader flex fill"
        :class="classes"
        :style="{
            '--manga-filter': imageFilter,
            '--manga-max-width': 'unset',
            '--manga-max-height': 'unset'
        }"
    >
        <Loading v-if="isLoading" />
        <Error v-else-if="!currentPage" :message="'No page found'" />
        <ReaderSinglePage
            v-else-if="mode === 'single-page'"
            :images="images"
            :current="currentPage"
            v-model:open="menuOpen"
            :style="pageStyle"
        />
        <ReaderDoublePage
            v-else-if="mode === 'double-page'"
            :images="images"
            :current="currentPage"
            v-model:open="menuOpen"
            :style="curPageStyle"
        />
        <ReaderLongStrip
            v-else-if="mode === 'long-strip'"
            :images="images"
            v-model:current="pageCheck"
            v-model:open="menuOpen"
            :tag-page="tagPage"
            :style="curPageStyle"
        />
        <div
            class="tutorial"
            v-if="showTutorial"
        >
            <div
                class="region flex"
                v-for="reg in regions"
                :key="reg.name"
                :class="reg.name"
                :style="{
                    'top': reg.y + '%',
                    'left': reg.x + '%',
                    'width': reg.width + '%',
                    'height': reg.height + '%'
                }"
            >
                <div
                    class="center flex row pad margin"
                    v-if="reg.name === 'center'"
                >
                    <h2 class="pad">Tutorial:</h2>
                    <p class="pad">
                        Click here (in the center) to open the side bar!
                    </p>
                    <button
                        class="icon-btn pad-left"
                        @click="() => showTutorial = false"
                    >
                        <Icon>close</Icon>
                        <p>Close Tutorial</p>
                    </button>
                </div>
                <div
                    class="center pad rounded bg-accent"
                    v-else-if="reg.name === 'left'"
                >
                    <p class="shadow">
                        Click anywhere here (on the red) to go back a page!
                    </p>
                </div>
                <div
                    class="center pad rounded bg-accent"
                    v-else-if="reg.name === 'right'"
                >
                    <p class="shadow">
                        Click anywhere here (on the green) to go to the next page!
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { FilterStyle, } from '~/models';
import type { ClassOptions, MbImage, booleanish } from '~/models';

const { get } = useImageCache();
const { isTrue, serClasses, parallelForEach } = useUtils();
const {
    brightness, pageStyle, filterStyle: filter,
    customFilter, preloadImages,
    autoLongStrip, autoLongStripStyle,
    showTutorial
} = useAppSettings();
const {
    currentPage, pages, preloadPages,
    error, setPageNumber,
    hasLongStripTag, regions,
} = useReaderHelper();

const props = defineProps<{
    loading?: booleanish;
    modelValue: boolean;
    'class'?: ClassOptions
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', v: boolean): void;
}>();

const _images = ref<PageImage[]>([]);
const tagPage = ref(0);
const pageCheck = computed({
    get: () => currentPage.value,
    set: (value: MbImage | undefined) => {
        if (!value?.ordinal) return;
        setPageNumber(value.ordinal);
    }
})
const images = computed(() => _images.value.toSorted((a, b) => a.image.ordinal - b.image.ordinal));
const isLoading = computed(() => isTrue(props.loading));
const menuOpen = computed({
    get: () => props.modelValue,
    set: (v) => emits('update:modelValue', v)
});

const curPageStyle = computed(() => {
    if (autoLongStrip.value && hasLongStripTag.value)
        return autoLongStripStyle.value;

    return pageStyle.value;
});

const mode = computed<'single-page' | 'long-strip' | 'double-page'>(() => <any>curPageStyle.value?.split(' ')[0] ?? 'single-page');

const imageFilter = computed(() => {
    let filters: { [key: string]: string } = {
        'brightness': brightness.value + '%'
    };

    switch(filter.value) {
        case FilterStyle.Invert: filters['invert'] = '100%'; break;
        case FilterStyle.BlueLight:
            filters['sepia'] = '40%';
            filters['saturate'] = '200%';
            break;
        case FilterStyle.BluePrint:
            filters['sepia'] = '100%';
            filters['saturate'] = '500%';
            filters['hue-rotate'] = '180deg';
            break;
        case FilterStyle.Custom:
            if (customFilter.value) return customFilter.value;
            break;
    }

    return Object.keys(filters)
        .map(key => `${key}(${filters[key]})`)
        .join(' ');
});

const classes = computed(() => serClasses(props.class, curPageStyle.value));

const loadImage = async (image: PageImage) => {
    if (image.state !== 'initial') return;

    image.state = 'loading';
    try {
        image.response = await get(image.image);
        image.state = image.response.image ? 'loaded' : 'error';
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

const mergeImageUpdates = (pages: MbImage[]) => {
    const current = [..._images.value];
    const output = [];

    for(const image of pages) {
        const found = current.find(i => i.image.id === image.id);
        const result = found ? found : {
            image,
            state: 'initial' as const
        };
        output.push(result);
    }

    _images.value = output;
    tapLoad();
}

const tapLoad = async () => {
    const images = _images.value.toSorted((a, b) => a.image.ordinal - b.image.ordinal);

    await parallelForEach(images, loadImage, {
        maxDegreesOfParallelism: preloadImages.value,
        startFromIndex: images.findIndex(i => i.image.id === currentPage.value?.id),
        reverseFill: true
    });
}

onMounted(() => nextTick(() => {
    watch([pages, preloadPages],
        () => mergeImageUpdates(pages.value),
        { deep: true, immediate: true });
}));
</script>

<style lang="scss" scoped>
$navwidth: 400px;

.manga-reader {
    position: relative;
    overflow: hidden;
    max-width: 100%;
    max-height: 100%;
    transition: all 150ms;

    .pages {
        width: 100%;
        height: 100%;
    }

    .image-filter {
        filter: var(--manga-filter);
    }

    &.external {
        a { text-decoration: underline; }
    }

    .tutorial {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-width: var(--full-width);
        max-height: var(--full-height);
        z-index: 2;

        .region {
            position: absolute;

            &.left { background-color: #70190a8f; }
            &.right { background-color: #4f960e8f; }
            &.center { background-color: var(--bg-color-accent-dark); }
        }
    }

    &.open { max-width: calc(100vw - #{$navwidth}); }
    &.over { max-width: 100% !important; }
}

@media only screen and (max-width: 600px) {
    .manga-reader { max-width: 100% !important; }
}
</style>
