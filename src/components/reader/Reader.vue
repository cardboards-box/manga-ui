<template>
    <Error v-if="error" :message="error" />
    <div v-else
        class="manga-reader flex"
        ref="clickarea"
        v-swipe
        @tap="pageClick"
        :class="classes"
        :style="{
            '--manga-filter': imageFilter,
            '--manga-width': maxImageWidth?.toString() ?? 'unset',
            '--manga-height': maxImageHeight?.toString() ?? 'unset'
        }"
    >
        <Loading v-if="isLoading" />

        <ReaderLongStrip
            v-else-if="pageStyle === PageStyle.LongStrip"
        />
        <!-- <template v-else-if="pageStyle === PageStyle.Single">
            <div
                class="image image-filter"
                :style="{
                    'background-image': `url(${pageUrl})`
                }"
            />
            <img class="hidden" v-if="nextPageUrl" :src="nextPageUrl" />
        </template>

        <template v-else-if="pageStyle === PageStyle.LongStrip">
            <img
                v-for="image of pageUrls"
                :src="image"
                class="image-filter"
            />
        </template>

        <template v-else-if="pageStyle === PageStyle.Double">
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
            <img :src="pageUrl" class="image-filter" />
            <img class="hidden" v-if="nextPageUrl" :src="nextPageUrl" />
        </template> -->

        <div class="progress-bar" :class="progressBar">
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
import { PageStyle, FilterStyle, ImageSize, ImageScroll } from '~/models';
import type { ClassOptions, booleanish } from '~/models';
const { isTrue, scrollers, serClasses } = useUtils();
const {
    invertControls, forwardOnly,
    brightness, pageStyle, imageSize, maxImageHeight, maxImageWidth, filterStyle: filter,
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

const classes = computed(() => serClasses(props.class, pageStyle.value, imageSize.value));

const scrollable = computed(() => {
    if (!clickarea.value) return {
        width: ImageScroll.None,
        height: ImageScroll.None
    };

    const check = (client: number, scroll: number, top: number, offset: number, type: 'vert' | 'horz') => {
        if (client >= scroll) return ImageScroll.None;

        // if (top + offset >= scroll) return ImageScroll.Done;
        // return ImageScroll.Doing;
        const percent = ((top / scroll) - client) * 100;
        console.log('Check Percent', {
            client,
            scroll,
            top,
            offset,
            percent,
            type
        });

        if (percent <= 0) return ImageScroll.Start;
        if (percent >= 100) return ImageScroll.End;
        return ImageScroll.Mid;
    }

    const el = clickarea.value;
    const height = check(el.clientHeight, el.scrollHeight, el.scrollTop, el.offsetHeight, 'vert');
    const width = check(el.clientWidth, el.scrollWidth, el.scrollLeft, el.offsetWidth, 'horz');

    return { width, height };
});

const { top: scrollUp, bottom: scrollDown, left: scrollLeft, right: scrollRight } = scrollers(clickarea, scrollAmount, scrollAmount);

const move = (forward: boolean) => {
    const n = invertControls.value ? 'PrevPage': 'NextPage';
    const b = invertControls.value ? 'NextPage': 'PrevPage';
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
        const link = genLink('NextPage');
        if (link) navigateTo(link);
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
    const { width, height } = scrollable.value;

    switch(ev.key) {
        case 'ArrowLeft':
            if (width === ImageScroll.None ||
                width === ImageScroll.Start) {
                if (down) return;
                move(false);
                return;
            }

            scrollLeft.value();
            return;
        case 'ArrowRight':
            if (width === ImageScroll.None ||
                width === ImageScroll.End) {
                if (down) return;
                move(true);
                return;
            }

            scrollRight.value();
            return;
        case 'ArrowUp':
            if (height === ImageScroll.Start ||
                height === ImageScroll.None) {
                if (down) return;
                move(false);
                return;
            }

            scrollUp.value();
            return;

        case 'ArrowDown':
            if (height === ImageScroll.End ||
                height === ImageScroll.None) {
                if (down) return;
                move(true);
                return;
            }

            scrollDown.value();
            return;
    }
};
const arrowKeyDown = (ev: KeyboardEvent) => arrowKeyHandler(ev, true);
const arrowKeyUp = (ev: KeyboardEvent) => arrowKeyHandler(ev, false);

// onMounted(() => nextTick(() => {
//     window.addEventListener('keyup', arrowKeyUp);
//     window.addEventListener('keydown', arrowKeyDown);
// }));

// onUnmounted(() => {
//     window.removeEventListener('keyup', arrowKeyUp);
//     window.removeEventListener('keydown', arrowKeyDown);
// })
</script>

<style scoped lang="scss">
$progress-height: 10px;
$navwidth: 400px;
.manga-reader {
    position: relative;
    overflow: auto;
    width: var(--full-width);
    height: var(--full-height);
    max-width: var(--full-width);
    max-height: var(--full-height);
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

    &.single {
        img {
            margin: 0 auto;
            &.hidden { display: none; }
        }
    }

    &.longstrip { flex-flow: column; }

    &.width {
        img {
            width: 100%;
            max-width: 100%;
            max-height: unset;
            margin: auto;
        }
    }

    &.height {
        img {
            margin: auto;
            max-width: unset;
            max-height: 100%;
            height: 100%;
        }
    }

    &.natural {
        img {
            margin: auto;
            max-width: unset;

            &.hidden {
                position: absolute;
                left: -100%;
            }
        }
    }

    &.custom-max {
        img {
            max-width: var(--manga-max-width);
            max-height: var(--manga-max-height);
        }
    }

    &.custom {
        img {
            width: var(--manga-max-width);
            height: var(--manga-max-height);
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
