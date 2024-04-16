<template>
    <Error v-if="error" :message="error" />
    <div v-else
        class="manga-reader flex fill"
        v-swipe
        @tap="pageClick"
        @swipe-left="move(true)"
        @swipe-right="move(false)"
        ref="clickarea"
        :class="classes"
        :style="{
            '--manga-filter': imageFilter,
            '--manga-max-width': 'unset',
            '--manga-max-height': 'unset'
        }"
    >
        <Loading v-if="isLoading" />
        <template v-else-if="pageStyle === PageStyle.SinglePageFit">
            <div
                class="image image-filter"
                :style="{
                    'background-image': `url(${pageUrl})`
                }"
            />
            <img class="hidden" v-if="nextPageUrl" :src="nextPageUrl" />
        </template>

        <template v-else-if="isLongStrip">
            <Image
                v-for="image of pageUrls"
                :src="image"
                class="image-filter"
            />
        </template>

        <template v-else-if="pageStyle === PageStyle.DoublePage">
            <div
                class="image image-filter"
                :style="{
                    'background-image': `url(${pageUrl})`
                }"
            />
            <div
                class="image image-filter"
                v-if="nextPageUrl"
                :style="{
                    'background-image': `url(${nextPageUrl})`,
                }"
            />
        </template>

        <template v-else>
            <Image :src="pageUrl" class="image-filter" />
            <img class="hidden" v-if="nextPageUrl" :src="nextPageUrl" />
        </template>

        <div class="progress-bar" :class="progressBar" v-if="!isLongStrip">
            <NuxtLink
                v-for="(_, i) of pageUrls"
                :to="genPageLink(i)"
                :class="{ 'active': i <= page }"
                class="progress"
            />
        </div>

        <ClientOnly>
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
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import { PageStyle, FilterStyle, } from '~/models';
import type { ClassOptions, booleanish } from '~/models';
const { isTrue, scrollers, serClasses } = useUtils();
const {
    invertControls, forwardOnly,
    brightness, pageStyle, filterStyle: filter,
    customFilter, progressBarStyle: progressBar,
    scrollAmount, showTutorial
} = useAppSettings();

const props = defineProps<{
    loading?: booleanish;
    modelValue: boolean;
    'class'?: ClassOptions
}>();
const emits = defineEmits<{
    (e: 'update:modelValue', v: boolean): void;
}>();
const clickarea = ref<HTMLElement | undefined>();
const { data, error, genLink, genPageLink, regions, inRegions } = useReaderHelper();
const isLoading = computed(() => isTrue(props.loading));
const page = computed(() => data.value?.pageIndex ?? 0);
const pageUrl = computed(() => data.value?.page);
const nextPageUrl = computed(() => data.value?.nextPage);
const pageUrls = computed(() => data.value?.pages ?? []);
const menuOpen = computed({
    get: () => props.modelValue,
    set: (v) => emits('update:modelValue', v)
});
const isLongStrip = computed(() => [
    PageStyle.LongStrip,
    PageStyle.LongStripNaturalSize,
    PageStyle.LongStripMaxSize
].includes(pageStyle.value));

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

const classes = computed(() => serClasses(props.class, pageStyle.value));

const { top: scrollUp, bottom: scrollDown } = scrollers(clickarea, scrollAmount, scrollAmount);

const move = (forward: boolean, chapter: boolean = false) => {
    const pp = chapter ? 'NextChapter': 'NextPage';
    const pn = chapter ? 'PrevChapter': 'PrevPage';
    const n = invertControls.value ? pn: pp;
    const b = invertControls.value ? pp: pn;
    const link = genLink(forward ? n: b);
    if (!link) return;

    navigateTo(link);
}

const pageClick = (event: MouseEvent) => {
    if (!clickarea.value) return;

    const output = inRegions(event);
    if(output.includes('center')) {
        menuOpen.value = !menuOpen.value;
        return;
    }

    if (forwardOnly.value) {
        const link = genLink(isLongStrip.value ? 'NextChapter' : 'NextPage');
        if (link) navigateTo(link);
        return;
    }

    let isBack = output.includes('left') || (output.includes('top') && !output.includes('right'));
    let isForward = output.includes('right') || (output.includes('bottom') && !output.includes('left'));

    if (isBack) {
        move(false, isLongStrip.value);
        return;
    }

    if (isForward) {
        move(true, isLongStrip.value);
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

onMounted(() => nextTick(() => {
    window.addEventListener('keyup', arrowKeyUp);
    window.addEventListener('keydown', arrowKeyDown);
}));

onUnmounted(() => {
    window.removeEventListener('keyup', arrowKeyUp);
    window.removeEventListener('keydown', arrowKeyDown);
})
</script>

<style scoped lang="scss">
$progress-height: 10px;
$navwidth: 400px;
.manga-reader {
    position: relative;
    overflow: auto;
    max-width: 100%;
    transition: all 150ms;

    img { max-width: 100%; }

    .image {
        flex: 1;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
    }

    .image-filter {
        filter: var(--manga-filter);
    }

    &.single-page {
        img {
            margin: 0 auto;
            &.hidden { display: none; }
        }
    }

    &.long-strip { flex-flow: column; }

    &.fit-to-width {
        img {
            width: 100%;
            max-width: 100%;
            max-height: unset;
            margin: auto;
        }
    }

    &.fit-to-height {
        img {
            margin: auto;
            max-width: unset;
            max-height: 100%;
            height: 100%;
        }
    }

    &.natural-size {
        img {
            margin: auto;
            max-width: unset;

            &.hidden {
                position: absolute;
                left: -100%;
            }
        }
    }

    &.custom-size {
        img {
            max-width: var(--manga-max-width);
            max-height: var(--manga-max-height);
        }
    }

    .progress-bar {
        position: fixed;
        display: flex;
        flex-flow: row;

        .progress {
            flex: 1;
            background-color: var(--bg-color-accent);
            transition: all 250ms;
            cursor: pointer;

            &.active { background-color: var(--color-primary-trans); }
        }

        &.bottom {
            width: 100%;
            height: $progress-height;
            bottom: 0;
            left: 0;

            .progress { height: 100%; }
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
            }

            &:hover { width: #{$progress-height * 2}; }
        }

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
</style>
