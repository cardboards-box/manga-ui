<template>
    <Card
        v-if="manga.closest"
        :manga="manga.closest"
        :override-style="overrideStyle"
        :content-ratings="contentRatings"
    >
        <div class="source">
            <span>
                <b>Resolved Through:</b>&nbsp;{{ manga.source }},
                <b>Score:</b>&nbsp;{{ manga.score.toFixed(2) }}%
                <span v-if="manga.exact">&nbsp;- <b>Exact Match</b></span>
            </span>
        </div>
        <div class="source" v-if="externalSources.length > 0">
            <span>
                <b>External Sources:</b>&nbsp;
                <span v-for="(source, index) in externalSources" :key="index">
                    <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.text }}</a>
                    <span v-if="index < externalSources.length - 1">, </span>
                </span>
            </span>
        </div>
    </Card>
    <div v-else-if="manga.source === 'sauce-nao'" class="ris-card" :class="actStyle">
        <Image
            v-if="manga.image"
            :src="proxiedUrl"
            :size="{ width: '200px', height: undefined }"
        />
        <div class="details">
            <div class="title">
                {{ manga.result?.data?.title }} {{ manga.result?.header.index_name }}
            </div>
            <div class="source">
                <span>
                    <b>Resolved Through:</b>&nbsp;{{ manga.source }},
                    <b>Score:</b>&nbsp;{{ manga.score.toFixed(2) }}%
                    <span v-if="manga.exact">&nbsp;- <b>Exact Match</b></span>
                </span>
            </div>
            <div class="source" v-if="externalSources.length > 0">
                <span>
                    <b>External Sources:</b>&nbsp;
                    <span v-for="(source, index) in externalSources" :key="index">
                        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.text }}</a>
                        <span v-if="index < externalSources.length - 1">, </span>
                    </span>
                </span>
            </div>
        </div>
    </div>
    <div v-else-if="manga.source === 'google-vision'" class="ris-card" :class="actStyle">
        <Image
            v-if="manga.image"
            :src="proxiedUrl"
            :size="{ width: '200px', height: undefined }"
        />
        <div class="details">
            <div class="title">
                <b v-if="manga.result?.title">{{ manga.result?.title }}</b>
            </div>
            <div class="source">
                <span>
                    <b>Resolved Through:</b>&nbsp;{{ manga.source }},
                    <b>Score:</b>&nbsp;{{ manga.score.toFixed(2) }}%
                    <span v-if="manga.exact">&nbsp;- <b>Exact Match</b></span>
                </span>
            </div>
            <div class="source" v-if="externalSources.length > 0">
                <span>
                    <b>External Sources:</b>&nbsp;
                    <span v-for="(source, index) in externalSources" :key="index">
                        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.text }}</a>
                        <span v-if="index < externalSources.length - 1">, </span>
                    </span>
                </span>
            </div>
        </div>
    </div>
    <div v-else>
        <Error message="Uhhh, you shouldn't be seeing this. The source is unknown, please tell Cardboard :)"  />
    </div>
</template>

<script setup lang="ts">
import { ListStyle } from '~/models';
import type { ImageSearchResultType, EnumDescription, ContentRating, MbMangaProgress } from '~/models';

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
    return proxy(props.manga.image ?? '');
});

</script>

<style lang="scss" scoped>
.ris-card {
    margin-top: var(--margin);
    display: flex;
    flex-flow: row;
    padding: var(--margin);
    text-decoration: none;
    transition: all 250ms;
    background-color: var(--bg-color-accent);
    overflow: hidden;
    border-radius: var(--margin);

    .image {
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        width: 200px;
        max-width: 30vw;
        min-height: 300px;
        border-radius: var(--margin);
        transition: all 250ms;
    }

    .details {
        flex: 1;
        display: flex;
        flex-flow: column;
        margin-left: var(--margin);
        max-height: 300px;
        overflow: hidden;
        transition: all 250ms;

        .title {
            display: flex;
            flex-flow: row;
            font-size: 1.5em;
            font-weight: 700;
            align-items: center;
            transition: all 250ms;

            a {
                flex: 1;
            }
        }

        .tags {
            .header {
                display: inline-block;
                font-weight: bold;
            }

            .tag {
                display: inline-block;
                padding: 3px 5px;
                margin: 3px;
                background-color: var(--color-default);
                border: 1px solid var(--bg-color-offset);
                border-radius: 3px;

                &.nsfw {
                    background-color: var(--color-warning);
                    text-transform: capitalize;
                }
            }
        }
    }

    &.compact {
        .image {
            max-height: 100px;
            min-height: 100px;
            max-width: 60px;
            min-width: unset;
        }

        .details {
            max-height: 100px;
            .title {
                font-size: 1rem;
                a { font-weight: bold; }
            }

            .tags, .source {
                display: none;
            }
        }
    }

    &.album {
        position: relative;
        display: flex;
        min-width: min(250px, 90vw);
        max-width: min(250px, 90vw);
        min-height: 400px;
        max-height: 400px;

        .image {
            flex: 1;
            transition: all 250ms;
            max-width: 100%;
        }

        .details {
            display: flex;
            position: absolute;
            bottom: -1px;
            left: 0;
            mask-image: none !important;
            width: 100%;
            max-width: 100%;
            margin: 0;

            .title {
                flex: 1;
                font-size: 1.25rem;
                color: #fff;
                margin: var(--margin);
                padding: var(--margin);
                border-radius: var(--margin);
                overflow: hidden;
                text-shadow: 0px 0px 10px #000;

                a {
                    font-weight: bold;
                    color: #fff;
                }
            }

            .tags, .source, .description {
                display: none;
            }
        }

        &:hover {
            .image {
                filter: brightness(0.8) grayscale(0.8);

                &.porn {
                    filter: brightness(0.8) grayscale(0.8) blur(0);
                }
            }

            .details .title {
                text-shadow: 0px 0px 6px #000;
            }
        }
    }

    &:hover .image.porn {
        filter: blur(0);
    }
}

.masked-overflow {
    --scrollbar-width: 0px;
    --mask-height: 32px;
    --mask-image-content: linear-gradient(
        to bottom,
        black,
        black calc(100% - var(--mask-height)),
        transparent
    );
    --mask-size-content: calc(100% - var(--scrollbar-width)) 100%;
    --mask-image-scrollbar: linear-gradient(black, black);
    --mask-size-scrollbar: var(--scrollbar-width) 100%;
    mask-image: var(--mask-image-content), var(--mask-image-scrollbar);
    mask-size: var(--mask-size-content), var(--mask-size-scrollbar);
    mask-position: 0 0, 100% 0;
    mask-repeat: no-repeat, no-repeat;
}
</style>
