<template>
    <Loading v-if="loading" />
    <Error v-else-if="error || !manga" :message="error ?? 'Manga Not Found!'" />
    <div v-else class="manga flex fill-parent scroll-y">
        <main class="manga-content flex">
            <aside class="details flex row" :class="{ 'volumed': canRead }">
                <Cover :image="cover" type="background" width="100%" height="400px" />
                <a class="title" :href="manga.url" target="_blank">{{ title }}</a>
                <div class="drawers margin-top">
                    <MangaProgress />
                    <Drawer title="Description" v-if="description" default-closed storage-key="manga-desc">
                        <Markdown :content="description" />
                    </Drawer>
                    <Drawer title="More Details" default-closed storage-key="manga-details">
                        <div class="tags">
                            <span>Alternate Titles</span>
                            <span v-if="extended?.displayTitle">{{ manga.title }}</span>
                            <span v-for="tag in manga.altTitles">{{ tag }}</span>
                        </div>
                        <div class="tags in-line">
                            <span>Tags </span>
                            <span v-if="rating" :class="{ 'warning': manga.nsfw }" :title="rating.description">{{ rating.name }}</span>
                            <NuxtLink
                                v-for="tag in tags"
                                :to="'/search/all?include=' + tag.id"
                                :title="tag.description"
                            >{{ tag.name }}</NuxtLink>
                        </div>
                        <div class="tags in-line">
                            <span>Details </span>
                            <span v-for="tag in manga.attributes">
                                <b>{{ tag.name }}</b>: {{ tag.value }}
                            </span>
                        </div>
                    </Drawer>
                    <Drawer title="Bookmarks" v-if="bookmarks && bookmarks.length > 0" default-closed storage-key="manga-bookmarks">
                        <div class="bookmarks flex row">
                            <template v-for="bookmark in bookmarks">
                                <div class="bm-chap flex">
                                    <Icon unsize size="28px" class="center-vert margin-left">import_contacts</Icon>
                                    <div class="center-vert margin-left">{{ chapterTitle(bookmark.chapter) }}</div>
                                </div>
                                <NuxtLink
                                    v-for="page in bookmark.progress?.bookmarks ?? []"
                                    class="bm-page flex margin-left"
                                    :to="`/manga/${manga.id}/${bookmark.chapter.id}?page=${page}`"
                                >
                                    <Icon unsize size="28px" class="center-vert margin-left">auto_stories</Icon>
                                    <div class="center-vert margin-left fill">Page. {{ page }}</div>
                                    <div class="center-vert margin-left mute"><Date :date="bookmark.progress?.createdAt" utc format="r" /></div>
                                </NuxtLink>
                            </template>
                        </div>
                    </Drawer>
                </div>
            </aside>
            <VolumeList
                v-if="canRead && volumes"
                :volumes="volumes"
                :manga="manga"
                :sort="params?.sort ?? ChapterOrderBy.Ordinal"
                :asc="params?.asc ?? true"
            />
        </main>
    </div>
</template>

<script setup lang="ts">
import { ChapterOrderBy } from '~/models';

const route = useRoute();
const { canRead } = useAuthHelper();
const { wrapUrl, apiUrl } = useSettingsHelper();
const cache = useCacheHelper();
const { chapterTitle } = useMangaUtils();

const {
    refresh, manga, extended,
    error, volumes, cover, tags,
    pending, throttled, params,
    bookmarks,
} = useCurrentManga();
const { pending: nuxtPending } = useAsyncData(async () => await refresh());
const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);
const rating = computed(() => contentRatings.value.find(t => t.value === manga.value?.contentRating));

const loading = computed(() => nuxtPending.value || pending.value);
const title = computed(() => extended.value?.displayTitle ?? manga.value?.title ?? 'Manga Not Found!');
const description = computed(() => manga.value?.description ?? 'Find your next binge on MangaBox!');
const coverImage = computed(() => cover.value ? wrapUrl(apiUrl, cover.value?.url) : 'https://mangabox.app/broken.png');

useHead({ title });

if (import.meta.server) useSeoMeta({
    title,
    description,
    ogImage: coverImage,
    twitterCard: 'summary_large_image'
});

watch(() => route.params.id, () => throttled(false));
watch(() => route.query.asc, () => throttled(false));
watch(() => route.query.sort, () => throttled(false));
watch(canRead, () => throttled(false));

onMounted(() => setTimeout(() => nextTick(() => {
    if (!canRead.value || (!error.value && manga.value)) return;
    refresh(true);
}), 200));
</script>

<style lang="scss" scoped>
.manga {
    position: unset;

    .manga-content {
        flex: 1;
        max-width: 1450px;
        margin: 0 auto;

        .details {
            position: relative;
            width: max(430px, 70%);
            margin: 5px auto;
            height: auto;

            a.title {
                font-size: 2em;
                text-align: center;
                margin-top: 5px;
                max-width: 100%;
                word-break: break-word;
            }

            .buttons {
                flex-flow: row wrap;
                align-items: center;

                button, a {
                    margin: 5px;
                    p { display: none; }
                }
            }

            &.volumed {
                width: 430px;
                margin: 5px !important;
            }
        }
    }
}

@media only screen and (max-width: 1050px) {
    .manga {
        flex-flow: column;


        .manga-content {
            flex-flow: column;
            margin: 5px;

            .details {
                width: unset !important;
                flex: 1;
            }
        }
    }
}

@media only screen and (max-width: 400px) {
    .buttons {
        margin: 5px;
        flex-flow: column;

        button, a {
            flex: 1;

            p {
                display: block;
                margin-left: 10px;
            }
        }
    }
}
</style>
