<template>
<div class="manga" v-if="mdata" :class="actStyle">
    <Cover
        type="link"
        :manga="mdata.manga"
    />
    <div class="details masked-overflow">
        <div class="title">
            <NuxtLink :to="'/manga/' + mdata.manga.id">
                {{ mdata.manga.displayTitle ?? mdata.manga.title }}
            </NuxtLink>
            <Icon :fill="!!mdata.icon.fill" v-if="mdata.icon" :title="mdata.icon.title">
                {{ mdata.icon.text }}
            </Icon>
            <IconBtn
                v-if="currentUser"
                inline
                :icon="mdata.favourited ? 'heart_minus' : 'favorite'"
                icon-size=""
                :loading="favouriteLoading"
                @click="toggleFavourite"
            />
        </div>
        <template v-if="mdata.stats">
            <div class="source" v-if="mdata.progress">
                <span>
                    <b>Progress: </b>&nbsp;
                    {{ mdata.stats.chapterProgress }}%&nbsp;
                    - <Date :date="mdata.progress.updatedAt.toString()" />
                </span>
            </div>
            <div class="source" v-if="mdata.chapter && mdata.progress">
                <span>
                    <b>Last Chapter Read: </b>&nbsp;
                    <span v-if="mdata.chapter.volume">Vol. {{ mdata.chapter.volume }} -&nbsp;</span>
                    <span>Ch. {{ mdata.chapter.ordinal }}</span>
                    <span v-if="mdata.chapter.title">&nbsp;- {{ mdata.chapter.title }}</span>
                </span>
            </div>
            <div class="source">
                <span>
                    <b>Latest Chapter: </b>&nbsp;
                    <Date :date="mdata.stats.latestChapter?.toString()" />
                </span>
            </div>
        </template>
        <div class="source">
            <b>Source:</b>&nbsp;{{ mdata.manga.provider }}
        </div>
        <div class="tags">
            <div class="header">Tags: </div>
            <div class="tag nsfw" v-if="mdata.manga.nsfw">{{ mdata.rating ?? 'NSFW' }}</div>
            <NuxtLink
                class="tag"
                v-for="tag of mdata.manga.tags"
                :to="'/search/all?include=' + tag.toLowerCase()"
            >
                {{ tag }}
            </NuxtLink>
        </div>
        <div class="description">
            <Markdown :content="mdata.manga.description" />
        </div>
    </div>
</div>
<div class="manga" v-if="sdata" :class="actStyle">
    <Cover
        type="link"
        :url="sdata.manga.cover"
        :link="'/import?url=' + encodeURIComponent(sdata.manga.url)"
    />
    <div class="details masked-overflow">
        <div class="title">
            <NuxtLink
                :to="'/import?url=' + encodeURIComponent(sdata.manga.url)"
            >
                {{ sdata.manga.title }}
            </NuxtLink>
        </div>
        <div class="source">
            <b>Source: </b>&nbsp;{{ sdata.manga.source }}
        </div>
        <div class="source" v-if="sdata.foundVia">
            <b>Found Via:</b>&nbsp;
            {{ sdata.foundVia.text }} (
                <span title="Confidence Compute Score">
                    CS: {{ sdata.foundVia.compute.toFixed(2) }}%
                </span>,
                <span title="Exact Match">
                    EM: {{ sdata.foundVia.exactMatch }}
                </span>
            )
        </div>
        <div class="source" v-if="sdata.link">
            <b>Link:</b>&nbsp;
            <a :href="sdata.link.url" target="_blank">{{ sdata.link.text }}</a>
        </div>
        <div class="tags">
            <div class="header">Tags: </div>
            <div class="tag nsfw" v-if="sdata.manga.nsfw">NSFW</div>
            <NuxtLink
                class="tag"
                v-for="tag of sdata.manga.tags"
                :to="'/search/all?include=' + tag.toLowerCase()"
            >
                {{ tag }}
            </NuxtLink>
        </div>
        <div class="description">
            <Markdown :content="sdata.manga.description" />
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import type {
    BaseResult, Chapter, ImageSearchManga, Manga,
    Stats, MatchResult, Progress, ProgressExt,
    VisionResult,
} from '~/models';
import { ListStyle } from '~/models';
const { listStyle } = useAppSettings();
const { currentUser } = useAuthApi();
const { toPromise } = useApiHelper();
const { favourite } = useMangaApi();

interface Props {
    search?: MatchResult | VisionResult | BaseResult | ImageSearchManga;
    manga?: Manga | ProgressExt;
    overridestyle?: ListStyle;
}

interface MangaData {
    manga: Manga;
    progress?: Progress;
    stats?: Stats;
    chapter?: Chapter;
    favourited: boolean;
    icon?: {
        text: string;
        title?: string;
        fill?: boolean;
    };
    rating?: string;
}

interface SearchData {
    manga: ImageSearchManga;
    foundVia?: {
        text: string;
        compute: number;
        exactMatch: boolean;
    };
    link?: {
        text: string;
        url: string;
    }
}

const { search, manga, overridestyle: style } = defineProps<Props>();
const mdata = ref(determineCardData());
const sdata = ref(determineSearchData());
const favouriteLoading = ref(false);
const actStyle = computed(() => style ?? listStyle.value);



function determineSearchData(): SearchData | undefined {
    if (!search) return undefined;

    const domain = (url: string) => new URL(url).hostname;

    if ('description' in search) {
        return {
            manga: search
        }
    }

    if ('filteredTitle' in search) {
        return {
            manga: search.manga,
            foundVia: {
                text: 'Google Vision',
                compute: search.score,
                exactMatch: search.exactMatch
            },
            link: {
                text: domain(search.url),
                url: search.url
            }
        }
    }

    if ('metadata' in search) {
        return {
            manga: search.manga,
            foundVia: {
                text: 'CBA Reverse Search',
                compute: search.score,
                exactMatch: search.exactMatch
            },
            link: {
                text: `${search.manga.source}: Page #${search.metadata.page}`,
                url: `https://mangadex.org/chapter/${search.metadata.chapterId}/${search.metadata.page}`
            }
        }
    }

    return {
        manga: search.manga,
        foundVia: {
            text: search.source === 'title lookup' ? 'Mangadex Search' : 'Sauce Nao',
            compute: search.score * 100,
            exactMatch: search.exactMatch
        },
        link: {
            text: `Manga Home Page`,
            url: `https://mangadex.org/manga/${search.manga.id}`
        }
    }
}

function determineCardData(): MangaData | undefined {
    if (!manga) return undefined;
    const data = ('id' in manga) ? manga : manga.manga;

    if (!manga || 'id' in manga) return {
        manga: data,
        favourited: false,
        rating: data.attributes.find(t => t.name === 'Content Rating')?.value
    };

    const { stats, progress, chapter } = manga;

    const getIcon = () => {
        if (stats?.chapterProgress === 100) return { text: 'check_circle', title: 'Completed' };
        if (stats?.hasBookmarks) return { text: 'bookmarks', title: 'Has Bookmarks' };
        if (progress) return { text: 'collections_bookmark', title: 'In Progress' };
        return undefined;
    }

    return {
        manga: data,
        progress: progress,
        stats: stats,
        chapter: chapter,
        icon: getIcon(),
        favourited: !!stats?.favourite,
        rating: data.attributes.find(t => t.name === 'Content Rating')?.value
    }
}

const toggleFavourite = async () => {
    if (!currentUser.value || !mdata.value) return;

    favouriteLoading.value = true;
    const result = await toPromise(favourite(mdata.value.manga.id)) ?? undefined;
    mdata.value.favourited = !!result;
    favouriteLoading.value = false;
}

const refresh = () => {
    mdata.value = determineCardData();
    sdata.value = determineSearchData();
}

watch(() => search, refresh, { immediate: true });
watch(() => manga, refresh, { immediate: true });
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
                font-size: 1rem;
                color: #fff;
                margin: var(--margin);
                padding: var(--margin);
                //
                border-radius: var(--margin);
                overflow: hidden;
                text-shadow: 0px 0px 4px #000;

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
