<template>
<img 
    v-if="itemType === 'img'" 
    :src="uri"
    :class="{ 'porn': isPorn }" 
    :style="actualStyles"
/>
<div
    v-else-if="itemType === 'background'"
    class="image" 
    :style="actualStyles"
    :class="{ 'porn': isPorn }"
/>
<NuxtLink 
    v-else
    :to="actualLink"
    class="image" 
    :style="actualStyles"
    :class="{ 'porn': isPorn }"
/>
</template>

<script setup lang="ts">
import { Manga } from '~/models';

type Styles = 'background' | 'img' | 'link';

const props = defineProps<{
    manga?: Manga,
    url?: string,
    isPorn?: boolean,
    type?: Styles,
    height?: string,
    width?: string,
    link?: string,
    styles?: { [key: string]: string }
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

const actualStyles = computed(() => {
    const items: { [key: string]: string } = props.styles || {};

    if ([ 'background', 'link'].includes(itemType.value)) { 
        items['background-image'] = `url(${uri.value})`;
    }
    if (props.height !== undefined) items['min-height'] = items['max-height'] = props.height;
    if (props.width !== undefined) items['min-width'] = items['max-width'] = props.width;

    return items;
});

const actualLink = computed(() => props.link ?? `/manga/${props.manga?.id}`);

</script>

<style lang="scss" scoped>
img {
    border-radius: var(--margin);
}

.image {
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: var(--margin);
    overflow: hidden;
}
</style>