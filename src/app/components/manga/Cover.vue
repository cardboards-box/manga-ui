<template>
<Image
    :src="uri"
    :type="itemType"
    :link="actualLink"
    :class="{ 'porn': isPorn, 'rounded': true }"
    :style="styles"
    :size="{ width: width, height: height }"
/>
</template>

<script setup lang="ts">
import type { MbImage, MbTypeManga, MbTypeMangaSearch, StyleOptions } from '~/models';

const { canRead } = useAuthHelper();
const { shouldBlur, getRelateds, getManga } = useMangaUtils();
const api = useMangaApi();

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

    return api.promise.image.downloadUrl(image.value.id);
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

</script>
