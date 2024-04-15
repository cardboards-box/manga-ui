<template>
    <NuxtImg
        :src="imageSrc"
        :placeholder="placeholder"
        :width="actSize?.width"
        :height="actSize?.height"
        :loading="lazyLoading"
        :style="styles"
        :class="classes"
        :preload="isPreload"
        :fit="fit ?? 'cover'"
        ref="image"
        @error="() => errored = true"
        @load="onLoad"
    />
</template>

<script setup lang="ts">
import type { booleanish, ClassOptions, StyleOptions } from '~/models';
const { serClasses, serStyles, isTrue, scale, cssUnit } = useUtils();
type CssUnit = string | number | undefined;
const DEFAULT_IMAGE = '/broken.png';

const props = defineProps<{
    src?: string;
    default?: string;
    error?: string;
    'class'?: ClassOptions;
    style?: StyleOptions;
    noLazy?: booleanish;
    round?: booleanish;
    rounded?: booleanish;
    preload?: booleanish;
    clampWidth?: string;
    clampHeight?: string;
    width?: string;
    height?: string;
    size?: string;
    fit?: string;
    parent?: HTMLElement;
}>();

const emit = defineEmits<{
    (e: 'intersect', v: {
        visible: boolean;
        ratio: number;
    }): void;
    (e: 'error'): void;
}>();

const classes = computed(() => serClasses(props.class, {
    'round': isTrue(props.round),
    'rounded': isTrue(props.rounded)
}));

const styles = computed(() => serStyles(props.style, {
    'width': (props.width || props.size)?.toString(),
    'height': (props.height || props.size)?.toString()
}));

const image = ref<HTMLImageElement>();
const actImage = computed(() => <HTMLImageElement>(<any>image.value)?.$el);
const actSize = ref<{ width: CssUnit; height: CssUnit }>();
const errored = ref(false);
const lazyLoading = computed(() => isTrue(props.noLazy) ? 'eager' : 'lazy');
const placeholder = computed(() => props.default || DEFAULT_IMAGE);
const imageSrc = computed(() => errored.value ? (props.error || placeholder.value) : (props.src || placeholder.value));
const isPreload = computed(() => isTrue(props.preload));
const observer = ref<IntersectionObserver>();

function onLoad (event: UIEvent) {
    setTimeout(() => {
        console.log('Image Loaded', {
            event,
            image: actImage.value
        });
        doObserver();
    }, 100);
}

const computeSize = () => {
    if (props.size) return { width: props.size, height: props.size };
    if (props.width || props.height) return { width: props.width, height: props.height };

    if (props.clampWidth && props.clampHeight && actImage.value) {
        const nw = actImage.value.naturalWidth;
        const nh = actImage.value.naturalHeight;
        const cw = cssUnit(props.clampWidth, actImage.value);
        const ch = cssUnit(props.clampHeight, actImage.value);

        const scaled = (cw && ch) ? scale(nw, nh, cw, ch) : undefined;
        console.log('Computed Size', {
            naturalWidth: nw,
            naturalHeight: nh,
            cw,
            ch,
            scale: scaled,
            image: { ...actImage.value }
        });

        return scaled;
    }

    return { width: 'auto', height: 'auto' };
};

const doObserver = () => {
    actSize.value = computeSize();

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

onMounted(() => {
    watch(() => props.parent, () => doObserver());
    watch(() => actImage.value, () => doObserver(), { deep: true });
    watch(() => props.src, () => errored.value = false);
    doObserver();
});

onUnmounted(() => {
    if (observer.value) {
        observer.value.disconnect();
        observer.value = undefined;
    }
});

</script>

<style lang="scss" scoped>
.round { border-radius: 50%; }
.rounded { border-radius: var(--brd-radius); }
</style>
