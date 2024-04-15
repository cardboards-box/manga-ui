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
import type { Manga, StyleOptions } from '~/models';

type Styles = 'background' | 'img' | 'link';

const props = defineProps<{
    manga?: Manga,
    url?: string,
    isPorn?: boolean,
    type?: Styles,
    height?: string,
    width?: string,
    link?: string,
    styles?: StyleOptions
}>();

const DEFAULT_IMAGE = '/broken.png';

const { proxy } = useApiHelper();
const { shouldBlur } = useMangaApi();

const url = computed(() => props.manga?.cover ?? props.url);
const uri = computed(() => url.value
    ? proxy(url.value, 'manga-cover', props.manga?.referer)
    : DEFAULT_IMAGE);

const isPorn = computed(() => !!props.isPorn || shouldBlur(props.manga));
const itemType = computed(() => props.type || 'link');

const actualLink = computed(() => props.link ?? `/manga/${props.manga?.id}`);

</script>
