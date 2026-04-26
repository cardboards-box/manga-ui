<template>
    <Image
        v-if="!hasSlot"
        :src="uri"
        :type="itemType"
        :link="actualLink"
        :class="{ 'porn': isPorn, 'rounded': true }"
        :style="styles"
        :size="{ width: width, height: height }"
    />
    <div
        class="image-container flex"
        :style="actStyles"
        v-else
    >
        <Image
            :src="uri"
            :type="itemType"
            :link="actualLink"
            :class="{ 'porn': isPorn, 'rounded': true }"
            :size="{ width: width, height: height }"
        />
        <div class="floating-buttons flex row">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MbImage, MbTypeManga, MbTypeMangaSearch, StyleOptions } from '~/models';

const { canRead } = useAuthHelper();
const { shouldBlur, getRelateds, getManga } = useMangaUtils();
const { serStyles } = useUtils();
const api = useMangaApi();
const slots = useSlots();

type Styles = 'background' | 'img' | 'link';

const props = defineProps<{
    manga?: MbTypeManga | MbTypeMangaSearch,
    image?: MbImage,
    url?: string,
    isPorn?: boolean,
    type?: Styles,
    height?: string,
    width?: string,
    link?: string,
    styles?: StyleOptions
}>();

const DEFAULT_IMAGE = '/broken.png';

const uri = computed(() => {
    if (props.url) return props.url;

    if (!image.value) return DEFAULT_IMAGE;

    return image.value;
});

const isPorn = computed(() => !!props.isPorn || shouldBlur(props.manga));
const itemType = computed(() => props.type || 'link');
const image = computed(() => props.image ?? (props.manga ? getRelateds(props.manga, 'MbImage').toSorted((a,b) => b.ordinal - a.ordinal)[0] : undefined));

const actualLink = computed(() => {
    if (props.link) return props.link;

    if (!props.manga) return undefined;

    const manga = getManga(props.manga);
    if (!manga) return undefined;

    return canRead ? `/manga/${manga.id}` : manga.url;
});

const hasSlot = computed(() => !!slots.default);

const actStyles = computed(() => serStyles(props.styles));

</script>

<style lang="scss" scoped>
.image-container {
    position: relative;

    .floating-buttons {
        position: absolute;
        top: var(--margin);
        right: var(--margin);
    }
}
</style>
