<template>
    <div
        class="long-strip flex row"
        v-swipe
        @tap="emits('click', $event)"
        @swipe-left="emits('move', true)"
        @swipe-right="emits('move', false)"
        ref="scroller"
        :class="classes"
        :style="styles"
    >
        <Image
            v-for="page in pageUrls"
            default="loading.gif"
            error="broken.png"
            :src="page"
            class="image-filter"
            :parent="scroller"
            clamp-width="100vw"
            clamp-height="100vh"
            @intersect="onIntersect"
        />
    </div>
</template>

<script setup lang="ts">
import { FilterStyle, ImageSize, ImageScroll } from '~/models';
import type { ClassOptions, StyleOptions, booleanish } from '~/models';

const { serClasses, serStyles, scrollStatus, resizeTrigger } = useUtils();
const { imageSize } = useAppSettings();

const props = defineProps<{
    'class'?: ClassOptions;
    'style'?: StyleOptions;
}>();

const emits = defineEmits<{
    (e: 'move', v: boolean): void;
    (e: 'click', v: MouseEvent): void;
}>();

const scroller = ref<HTMLDivElement | undefined>();
const pageHeight = ref(0);
const pageWidth = ref(0);

const { data } = useReaderHelper();
const pageUrls = computed(() => data.value?.pages ?? []);
const classes = computed(() => serClasses(props.class, imageSize.value));
const styles = computed(() => serStyles(props.style, {
    '--page-width': `${pageWidth.value}px`,
    '--page-height': `${pageHeight.value}px`
}));

const onIntersect = (v: { visible: boolean; ratio: number }) => {
    //console.log('intersect', v);
};

const key = (ev: KeyboardEvent, down: boolean) => {
    const { width, height } = scrollStatus(scroller.value);
}

const keyDown = (ev: KeyboardEvent) => key(ev, true);
const keyUp = (ev: KeyboardEvent) => key(ev, false);
const resize = () => {
    pageHeight.value = (scroller.value?.clientHeight ?? window.innerHeight);
    pageWidth.value = (scroller.value?.clientWidth ?? window.innerWidth);
}


onMounted(() => nextTick(() => {
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    watch(() => resizeTrigger.value, () => resize(), { immediate: true });
}));

onUnmounted(() => {
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('resize', resize);
});

</script>

<style scoped lang="scss">
$img-width: var(--page-width);
$img-height: var(--page-height);

.long-strip {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--full-width);
    height: var(--full-height);
    max-width: var(--full-width);
    max-height: var(--full-height);
    overflow: auto;

    img {
        margin: 0 auto;
    }

    &.fit {
        object-fit: cover;
        overflow-x: hidden;

        .image-filter {
            max-height: $img-height;
            max-width: $img-width;
        }
    }

    &.height {
        img {
            max-height: $img-height;
            min-height: $img-height;
            height: $img-height;
        }
    }

    &.width {
        img {
            max-width: $img-width;
            min-width: $img-width;
            width: $img-width;
        }
    }
}
</style>
