<template>
    <div class="card" :class="style">
        <Cover
            type="link"
            :image="coverImage"
            :url="coverUrl"
            :manga="coverManga"
            :link="link"
        />
        <div class="details masked-overflow">
            <header>
                <NuxtLink
                    v-if="hasLink"
                    :to="link"
                    :target="external ? '_blank' : '_self'"
                    class="title"
                >
                    {{ title }}
                </NuxtLink>
                <div v-else class="title">{{ title }}</div>
                <slot name="title" />
            </header>
            <slot />
            <div class="description">
                <Markdown v-if="description" :content="description" />
                <slot name="description" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    ListStyle, MbImage,
    MbTypeManga, MbTypeMangaSearch
} from '~/models';

type CoverOptions = MbImage | MbTypeManga | MbTypeMangaSearch | string;

const props = defineProps<{
    cover?: CoverOptions;
    style: ListStyle;
    title: string;
    link?: string;
    description?: string;
}>();

const hasLink = computed(() => !!props.link);
const external = computed(() => hasLink.value && props.link!.toLocaleLowerCase().startsWith('http'));

const coverImage = computed(() => props.cover &&
    typeof props.cover !== 'string' &&
    'ordinal' in props.cover ? props.cover : undefined);

const coverUrl = computed(() => props.cover &&
    typeof props.cover === 'string' ? props.cover : undefined);

const coverManga = computed(() => {
    if (!props.cover) return undefined;
    if (typeof props.cover === 'string') return undefined;
    if ('ordinal' in props.cover) return undefined;
    return props.cover;
});
</script>

<style lang="scss" scoped>
.card {
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

        header {
            display: flex;
            flex-flow: row;
            font-size: clamp(16px, 3vw, 1.5em);
            font-weight: bolder;
            align-items: center;
            transition: all 250ms;

            .title {
                flex: 1;
                font-weight: bolder;
            }
        }

        &.masked-overflow {
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

            header {
                font-size: 1rem;
                .title { font-weight: bold; }
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

            header {
                flex: 1;
                font-size: 1.25rem;
                color: #fff;
                margin: var(--margin);
                padding: var(--margin);
                border-radius: var(--margin);
                overflow: hidden;
                text-shadow: 0px 0px 5px #000,
                    0px 0px 10px #000,
                    0px 0px 20px #000;

                .title {
                    font-weight: bold;
                    color: #fff;
                }
            }

            .description {
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

            .details header .title {
                text-shadow: 0px 0px 6px #000;
            }
        }
    }

    &:hover .image.porn {
        filter: blur(0);
    }
}
</style>
