<template>
    <NuxtImg
        :src="outputResult"
        :width="actSize.width"
        :height="actSize.height"
        :style="styles"
        :class="classes"
        ref="image"
    />
</template>

<script setup lang="ts">
import type { ClassOptions, StyleOptions } from '~/models';
type CssUnit = string | undefined;
type WH = { width: CssUnit, height: CssUnit };
type Size<T = {}> = CssUnit | (WH & T);
type Intersect = { visible: boolean; ratio: number; };

const DEFAULT_IMAGE = '/broken.png';

const { serClasses, serStyles, scale, cssUnit, debug } = useUtils();

const props = defineProps<{
    src?: string;
    default?: string;
    error?: string;
    'class'?: ClassOptions;
    style?: StyleOptions;
    size?: Size;
    clampWidth?: CssUnit;
    clampHeight?: CssUnit;
    clampMode?: 'contain' | 'fill';
    parent?: HTMLElement;
}>();

const emit = defineEmits<{
    (e: 'intersect', v: Intersect): void;
    (e: 'errored'): void;
    (e: 'loaded'): void;
}>();

const image = ref<HTMLImageElement | undefined>();
const observer = ref<IntersectionObserver>();

const actSrc = computed(() => props.src || props.default || DEFAULT_IMAGE);
const actSize = ref<{ width: CssUnit; height: CssUnit }>({ width: undefined, height: undefined });
const actImage = computed(() => <HTMLImageElement>(<any>image.value)?.$el);
const classes = computed(() => serClasses(props.class));
const styles = computed(() => serStyles(props.style));
const outputResult = computed(() => {
    if (result.value) return result.value;
    if (state.value === 'loading') return props.default;
    if (state.value === 'error') return props.error || DEFAULT_IMAGE;
    return actSrc.value;
});

const getClampValue = (target: HTMLElement) => {
    if (!props.clampWidth && !props.clampHeight) return undefined;

    return {
        width: resolveCss(props.clampWidth, target),
        height: resolveCss(props.clampHeight, target),
        mode: props.clampMode ?? 'contain'
    };
}

const resolveCss = (value: CssUnit, image: HTMLElement, def?: number) => {
    if (!value) return def;
    if (typeof value === 'number') return value;
    return cssUnit(value, image);
}

const computeSize = () => {
    if (props.size) {
        if (typeof props.size === 'string') {
            return { width: props.size, height: props.size }
        }

        return props.size;
    }

    const target = actImage.value ?? props.parent;
    const noClamp = !props.clampWidth && !props.clampHeight;
    if (noClamp || !size.value || !target) {
        return { width: undefined, height: undefined };
    }

    const { width: clampW, height: clampH, mode } = getClampValue(target)!;
    if (mode === 'fill') {
        return { width: clampW + 'px', height: clampH + 'px' };
    }

    if (clampW && !clampH) {
        return { width:  clampW + 'px', height: 'auto' };
    }
    if (!clampW && clampH) {
        return { width: 'auto', height: clampH + 'px' };
    }
    if (!clampW && !clampH) {
        return { width: undefined, height: undefined };
    }


    const { width, height } = size.value;
    const { width: w, height: h } = scale(width, height, clampW!, clampH!);
    return {
        width: w + 'px',
        height: h + 'px'
    };
}

const doObserver = () => {
    onResize(undefined);

    const img = actImage.value;
    if (observer.value) {
        observer.value.disconnect();
        observer.value = undefined;
    }

    if (!props.parent || !img) return;

    const options = {
        root: props.parent,
        rootMargin: '0px',
        threshold: 0.1
    }
    observer.value = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            emit('intersect', {
                visible: entry.isIntersecting,
                ratio: entry.intersectionRatio
            });
        });
    }, options);
    observer.value.observe(img);
}

const actualResize = () => {
    actSize.value = computeSize();
}

const onResize = (_: UIEvent | undefined) => actualResize();

const onLoad = () => {
    emit('loaded');
    onResize(undefined);
    debug('Image Loaded', { duration: duration.value, size: size.value, src: result.value });
};
const onError = () => emit('errored');

const {
    state,
    result,
    size,
    duration,
    refresh
} = useImageHelper(actSrc, {
    onLoad,
    onError,
    imediate: false
});

onMounted(() => nextTick(() => {
    refresh();
    watch(() => actImage.value, () => doObserver(), { deep: true });
    watch(() => props, () => onResize(undefined), { deep: true });
    doObserver();
    window.addEventListener('resize', onResize);
}));

onUnmounted(() => {
    if (observer.value) {
        observer.value.disconnect();
        observer.value = undefined;
    }

    window.removeEventListener('resize', onResize);
});
</script>

<style scoped lang="scss">
.round { border-radius: 50%; }
.rounded { border-radius: var(--brd-radius); }
</style>
