<template>
    <Error v-if="error" :message="error" />
    <div 
        class="manga-reader flex fill"
        v-swipe
        @tap="pageClick"
        @swipe-left="move(true)"
        @swipe-right="move(false)"
        ref="clickArea"
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
            :open="menuOpen"
        />
        <ReaderLongStrip
            v-else-if="mode === 'long-strip'"
            :images="images"
            v-model:current="pageCheck"
            v-model:percentage="percentage"
            :open="menuOpen"
            :tag-page="tagPage"
        />

        <div class="progress-bar" :class="progressBar">
            <NuxtLink
                v-for="page of images"
                :key="page.image.id"
                :to="pageLink(page.image)"
                :class="determineStateClass(page)"
                class="progress"
            />
            <div 
                class="progress-percent"
                v-if="isLongStrip"
            />
        </div>
        
        <div class="tutorial" v-if="showTutorial">
            <div
                class="region flex"
                v-for="reg in regions"
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
import { PageStyle, FilterStyle, } from '~/models';
import type { ClassOptions, MbImage, booleanish } from '~/models';

const { get } = useImageCache();
const { isTrue, scrollers, serClasses, parallelForEach } = useUtils();
const {
    invertControls, forwardOnly,
    brightness, pageStyle, filterStyle: filter,
    customFilter, progressBarStyle: progressBar,
    scrollAmount, showTutorial, preloadImages
} = useAppSettings();
const {
    currentPage, pages, preloadPages,
    error, regions, inRegions, findNext,
    chapter, setPageNumber, findPrev,
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
const percentage = ref(0);
const tagPage = ref(0);
const pageCheck = computed({
    get: () => currentPage.value,
    set: (value: MbImage | undefined) => {
        if (!value?.ordinal) return;
        setPageNumber(value.ordinal);
    }
})
const images = computed(() => _images.value.toSorted((a, b) => a.image.ordinal - b.image.ordinal));
const clickArea = ref<HTMLElement | undefined>();
const isLoading = computed(() => isTrue(props.loading));
const menuOpen = computed({
    get: () => props.modelValue,
    set: (v) => emits('update:modelValue', v)
});

const mode = computed<'single-page' | 'long-strip' | 'double-page'>(() => <any>pageStyle.value?.split(' ')[0] ?? 'single-page');

const isLongStrip = computed(() => mode.value === 'long-strip');
const fullPercent = computed(() => `${percentage.value}%`);

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

const pageLink = (page: MbImage) => `/chapter/${chapter.value?.id}?page=${page.ordinal}`;

type ClassMap = `${('error' | 'loading' | 'initial' | 'loaded')} ${('read' | 'current' | 'unread')}`;
const determineStateClass = (page: PageImage): ClassMap => {
    const index = images.value.findIndex(i => i.image.id === page.image.id);
    const currentIndex = images.value.findIndex(i => i.image.id === currentPage.value?.id);

    const readState = index < currentIndex ? 'read' : index === currentIndex ? 'current' : 'unread';
    return `${page.state} ${readState}`;
}

const classes = computed(() => serClasses(props.class, pageStyle.value));
const { top: scrollUp, bottom: scrollDown } = scrollers(clickArea, scrollAmount, scrollAmount);

const moveToRoute = (route: { route: string; id?: string; page?: number }) => {
    if (!isLongStrip.value 
        || route.route !== 'chapter' 
        || chapter.value?.id !== route.id) {
        let next = `/${route.route}/${route.id}`;
        if (route.page) next += `?page=${route.page}`;
        navigateTo(next);
        return;
    }

    const page = route.page ?? 1;
    setPageNumber(page);
    tagPage.value = page;
}

const move = (forward: boolean) => {
    const pp = () => findNext('page');
    const pn = () => findPrev('page');
    const n = invertControls.value ? pn: pp;
    const b = invertControls.value ? pp: pn;
    const route = (forward ? n : b)();
    moveToRoute(route);
}

const pageClick = (event: MouseEvent) => {
    if (!clickArea.value) return;

    const output = inRegions(event);
    if(output.includes('center')) {
        menuOpen.value = !menuOpen.value;
        return;
    }

    if (forwardOnly.value) {
        const route = findNext('page');
        moveToRoute(route);
        return;
    }

    let isBack = output.includes('left') || (output.includes('top') && !output.includes('right'));
    let isForward = output.includes('right') || (output.includes('bottom') && !output.includes('left'));

    if (isBack) {
        move(false);
        return;
    }

    if (isForward) {
        move(true);
        return;
    }
}

const arrowKeyHandler = (ev: KeyboardEvent, down: boolean) => {
    const scrollabled = [
        PageStyle.LongStrip,
        PageStyle.SinglePageFitToWidth,
        PageStyle.SinglePageNaturalSize
    ].indexOf(pageStyle.value) !== -1;

    switch(ev.key) {
        case 'ArrowLeft': if(!down) move(false); return;
        case 'ArrowRight': if(!down) move(true);  return;
        case 'ArrowUp':
            if (!scrollabled) {
                move(false);
                return;
            }

            scrollUp.value();
            return;

        case 'ArrowDown':
            if (!scrollabled) {
                move(true);
                return;
            }

            scrollDown.value();
            return;
    }
};
const arrowKeyDown = (ev: KeyboardEvent) => arrowKeyHandler(ev, true);
const arrowKeyUp = (ev: KeyboardEvent) => arrowKeyHandler(ev, false);

const loadImage = async (image: PageImage) => {
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
    });
}

onMounted(() => nextTick(() => {
    window.addEventListener('keyup', arrowKeyUp);
    window.addEventListener('keydown', arrowKeyDown);

    watch([pages, preloadPages], 
        () => mergeImageUpdates(pages.value), 
        { deep: true, immediate: true });
}));

onUnmounted(() => {
    window.removeEventListener('keyup', arrowKeyUp);
    window.removeEventListener('keydown', arrowKeyDown);
});
</script>

<style lang="scss" scoped>
$progress-height: 10px;
$navwidth: 400px;
$progress-margin: 1px;

$loading-primary: var(--color-primary);
$loading-secondary: transparent;
$loading-speed: 0.5s;
$current-border-fade-speed: 1.25s;
$progress-percent: v-bind(fullPercent);
$progress-percent-dot-size: 8px;

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

    .progress-bar {
        position: fixed;
        display: flex;
        flex-flow: row;

        .progress {
            flex: 1;
            box-sizing: border-box;
            background-color: var(--color-primary);
            transition: all 250ms;
            cursor: pointer;

            // Loading states
            &.loading {
                background: repeating-linear-gradient(90deg, #{$loading-primary} 0 calc(25% - 5px), #{$loading-secondary} 0 25%) left/calc(4*100%/3) 100%;
                animation: loading-animation #{$loading-speed} infinite linear;
            }
            &.initial { background: color-mix(in srgb, var(--color-primary) 20%, transparent); }
            &.error { background-color: var(--color-warning); }
            &.loaded { background-color: var(--color-primary); }

            // read states
            &.read { border: 1px solid var(--color-primary); }
            &.current {
                border: 3px solid var(--color);
                animation: current-border-fade #{$current-border-fade-speed} infinite ease-in-out;
            }
            &.unread { border: 1px dashed var(--color); }
        }

        .progress-percent {
            position: absolute;

            &::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: $progress-percent-dot-size;
                height: $progress-percent-dot-size;
                border-radius: 50%;
                background-color: var(--color-warning);
                border: 1px solid var(--color);
                transform: translate(-50%, -50%);
            }
        }

        &.bottom, &.top {
            width: 100%;
            height: $progress-height;
            left: 0;

            .progress { 
                height: 100%; 
                margin: 0 $progress-margin;
            }

            .progress-percent {
                left: $progress-percent;
                bottom: 0;
                width: 2px;
                height: 100%;
            }

            &:hover { height: #{$progress-height * 2}; }
        }

        &.left, &.right {
            top: 0;
            height: 100%;
            flex-flow: column;
            width: $progress-height;

            .progress {
                width: 100%;
                height: 100%;
                margin: $progress-margin 0;

                &.loading {
                    background: repeating-linear-gradient(180deg, #{$loading-primary} 0 calc(25% - 5px), #{$loading-secondary} 0 25%) top/100% calc(4*100%/3);
                    animation: loading-animation-vertical #{$loading-speed} infinite linear;
                }
            }

            .progress-percent {
                top: $progress-percent;
                left: 0;
                width: 100%;
                height: 2px;
            }

            &:hover { width: #{$progress-height * 2}; }
        }

        &.top { top: 0; }
        &.bottom { bottom: 0; }
        &.left { left: 0; }
        &.right { right: 0; }
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

@keyframes loading-animation {
    100% { background-position: right; }
}

@keyframes loading-animation-vertical {
    100% { background-position: bottom; }
}

@keyframes current-border-fade {
    0% { border-color: var(--color); }
    50% { border-color: var(--color-primary); }
    100% { border-color: var(--color); }
}
</style>