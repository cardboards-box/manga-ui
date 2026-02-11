<template>
    <div class="manga" :class="actStyle">
        <Cover :manga="manga" type="link" />
        <div class="details masked-overflow">
            <div class="title">
                <NuxtLink :to="link">{{ displayTitle }}</NuxtLink>
                <template v-if="canRead">
                    <Icon title="Completed" v-if="completed">check_circle</Icon>
                    <Icon title="In Progress" v-if="inProgress">autorenew</Icon>
                    <IconBtn
                        v-if="canRead"
                        inline
                        :icon="favorited ? 'heart_minus' : 'favorite'"
                        icon-size=""
                        :loading="favLoading"
                        @click="toggleFavorite"
                    />
                </template>
            </div>
            <slot />
            <div class="source" v-if="progPerc !== 0">
                <span>
                    <b>Progress:</b> &nbsp;
                    {{ progPerc.toFixed(2) }}%&nbsp;
                    - <Date :date="actProgress?.lastReadAt" utc />
                </span>
            </div>
            <template v-if="ext">
                <div class="source">
                    <span>
                        <b>Latest Chapter:</b>&nbsp;
                        <Date :date="ext.lastChapterCreated" utc />
                    </span>
                </div>
                <div class="source">
                    <span>
                        <b>Stats:</b>&nbsp;
                        {{ ext.chapterCount }} Chapter{{ ext.chapterCount !== 1 ? 's' : '' }}
                        <span v-if="ext.volumeCount > 0">&nbsp;in {{ ext.volumeCount }} Volume{{ ext.volumeCount !== 1 ? 's' : '' }}</span>
                        <span v-if="ext.daysBetweenUpdates > 0">&nbsp;- Updating every {{ ext.daysBetweenUpdates.toFixed(2) }} days</span>
                    </span>
                </div>
            </template>
            <div class="source">
                <span>
                    <b>Source:</b>&nbsp; <a :href="manga.entity.url">{{ source?.name }}</a>
                </span>
            </div>
            <div class="tags">
                <div class="header">Tags: </div>
                <div
                    v-if="rating"
                    class="tag"
                    :class="{
                        'nsfw': rating.value !== ContentRating.Safe
                    }"
                >{{ rating.name }}</div>
                <NuxtLink
                    class="tag"
                    v-for="tag of tags"
                    :to="'/search/all?include=' + tag.id"
                >
                    {{ tag.name }}
                </NuxtLink>
            </div>
            <div class="description">
                <Markdown :content="manga.entity.description" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ContentRating, ListStyle } from '~/models';
import type { EnumDescription, MbMangaProgress, MbTypeManga, MbTypeMangaSearch } from '~/models';

const { listStyle } = useAppSettings();
const { canRead } = useAuthHelper();
const { getRelateds, getRelated } = useMangaUtils();
const api = useMangaApi();
const progressCache = useProgressCacheHelper();

const props = defineProps<{
    manga: MbTypeManga | MbTypeMangaSearch;
    overrideStyle?: ListStyle;
    contentRatings: EnumDescription<ContentRating>[];
}>();

const _localProg = ref<MbMangaProgress | undefined>();
const cache = computed(() => progressCache.cache.value[props.manga.entity.id]);
const actProgress = computed(() => _localProg.value ?? cache.value);
const favLoading = ref(false);

const tags = computed(() => getRelateds(props.manga, 'MbTag'));
const ext = computed(() => getRelated(props.manga, 'MbMangaExt'));
const source = computed(() => getRelated(props.manga, 'MbSource'));
const actStyle = computed(() => props.overrideStyle ?? listStyle.value);

const favorited = computed(() => actProgress.value?.favorited);
const completed = computed(() => actProgress.value?.isCompleted);
const progPerc = computed(() => actProgress.value?.progressPercentage ?? 0);
const inProgress = computed(() => progPerc.value > 0 && progPerc.value < 100);
const rating = computed(() => props.contentRatings.find(t => t.value === props.manga.entity.contentRating));
const displayTitle = computed(() => ext.value?.displayTitle ?? props.manga.entity.title);

const link = computed(() => canRead.value ? `/manga/${props.manga.entity.id}` : props.manga.entity.url);

const toggleFavorite = async () => {
    if (!canRead.value || !actProgress.value) return;

    favLoading.value = true;
    const result = await (favorited.value
        ? api.promise.manga.unfavorite(props.manga.entity.id)
        : api.promise.manga.favorite(props.manga.entity.id));
    favLoading.value = false;
    if (!api.isSuccess(result)) return;

    _localProg.value = api.data(result)?.entity;
    progressCache.clear(props.manga.entity.id);
}
</script>

<style lang="scss" scoped>
.manga {
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
