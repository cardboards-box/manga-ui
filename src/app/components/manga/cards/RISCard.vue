<template>
    <MangaCard
        v-if="manga.closest"
        :manga="manga.closest"
        :override-style="overrideStyle"
        :content-ratings="contentRatings"
    >
        <CardLine title="Resolved Through" :style="actStyle">
            {{ manga.source }},
            <b>Score:</b>&nbsp;{{ manga.score.toFixed(2) }}%
            <span v-if="manga.exact">&nbsp;- <b>Exact Match</b></span>
        </CardLine>
        <CardTags title="External Sources"  :style="actStyle" v-if="externalSources.length > 0">
            <CardTag
                v-for="(source, index) in externalSources" :key="index"
                :link="source.url"
            >{{ source.text }}</CardTag>
        </CardTags>
    </MangaCard>
    <Card
        v-else-if="manga.source === 'sauce-nao' || manga.source === 'google-vision'"
        :style="actStyle"
        :cover="proxiedUrl"
        :title="title"
    >
        <CardLine title="Resolved Through" :style="actStyle">
            {{ manga.source }},
            <b>Score:</b>&nbsp;{{ manga.score.toFixed(2) }}%
            <span v-if="manga.exact">&nbsp;- <b>Exact Match</b></span>
        </CardLine>
        <CardTags title="External Sources"  :style="actStyle" v-if="externalSources.length > 0">
            <CardTag
                v-for="(source, index) in externalSources" :key="index"
                :link="source.url"
            >{{ source.text }}</CardTag>
        </CardTags>
    </Card>
    <div v-else>
        <Error message="Uhhh, you shouldn't be seeing this. The source is unknown, please tell Cardboard :)"  />
    </div>
</template>

<script setup lang="ts">
import { ListStyle } from '~/models';
import type { ImageSearchResultType, EnumDescription, ContentRating } from '~/models';

const { listStyle } = useAppSettings();
const { proxy } = useMangaUtils();

const props = defineProps<{
    manga: ImageSearchResultType;
    overrideStyle?: ListStyle;
    contentRatings: EnumDescription<ContentRating>[];
}>();

const actStyle = computed(() => props.overrideStyle ?? listStyle.value);
const externalSources = computed(() => {
    const urls = [];

    if (props.manga.source === 'google-vision') {
        if (props.manga.result?.url)
            urls.push(props.manga.result?.url);
        for(const result of props.manga.result?.fullMatches ?? []) {
            urls.push(result.url);
        }
        for(const result of props.manga.result?.partialMatches ?? []) {
            urls.push(result.url);
        }
    } else if (props.manga.source === 'sauce-nao') {
        for(const result of props.manga.result?.data?.ext_urls ?? []) {
            urls.push(result);
        }
    }

    return urls
        .map(t => {
            if (!t) return undefined;
            try {
                const url = new URL(t);
                return {
                    text: url.hostname,
                    url: url.href
                }
            } catch {
                return undefined;
            }
        })
        .filter(t => !!t)
        .map(t => t!);
});

const proxiedUrl = computed(() => {
    return props.manga.image ? proxy(props.manga.image) : '/twirl.gif';
});

const title = computed(() => {
    if (props.manga.source === 'sauce-nao')
        return `${props.manga.result?.data?.title} ${props.manga.result?.header.index_name}`;

    if (props.manga.source === 'google-vision')
        return props.manga.result?.title ?? 'Google Vision Result';

    return 'Unknown Source Result';
})
</script>

