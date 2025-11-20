<template>
    <Loading v-if="isLoading" />
    <Error v-else-if="error || !data" :error="error ?? 'Manga Not Found'" />
    <div v-else class="manga flex fill-parent scroll-y">
        <main class="manga-content flex">
            <aside class="details flex row" :class="{ 'volumed': canRead }">
                <Cover :manga="data.manga" type="background" width="100%" height="400px" />
                <a class="title" :href="data.manga.url" target="_blank">{{ title }}</a>
                <div class="drawers margin-top">
                    <MangaProgress />
                    <Drawer title="Description" v-if="description" default-closed>
                        <Markdown :content="description" />
                    </Drawer>
                    <Drawer title="More Details" default-closed>
                        <div class="tags">
                            <span>Alternate Titles</span>
                            <span v-if="data.manga.displayTitle">{{ data.manga.title }}</span>
                            <span v-for="tag in data.manga.altTitles">{{ tag }}</span>
                        </div>
                        <div class="tags in-line">
                            <span>Tags </span>
                            <span v-if="data.manga.nsfw" class="warning">Nsfw</span>
                            <NuxtLink v-for="tag in data.manga.tags" :to="'/search/all?include=' + tag">{{ tag }}</NuxtLink>
                        </div>
                        <div class="tags in-line">
                            <span>Details </span>
                            <span v-for="tag in data.manga.attributes">
                                <b>{{ tag.name }}</b>: {{ tag.value }}
                            </span>
                        </div>
                    </Drawer>
                    <Drawer title="Bookmarks" v-if="bookmarks && bookmarks.length > 0" default-closed>
                        <div class="bookmarks flex row">
                            <template v-for="bookmark in bookmarks">
                                <div class="bm-chap flex">
                                    <Icon unsize size="28px" class="center-vert margin-left">import_contacts</Icon>
                                    <div class="center-vert margin-left">{{ bookmark.chapter.title }}</div>
                                </div>
                                <NuxtLink
                                    v-for="page in bookmark.pages"
                                    class="bm-page flex margin-left"
                                    :to="`/manga/${data.manga.id}/${bookmark.chapter.chapter.id}?page=${page}`"
                                >
                                    <Icon unsize size="28px" class="center-vert margin-left">auto_stories</Icon>
                                    <div class="center-vert margin-left fill">Page. {{ page }}</div>
                                    <div class="center-vert margin-left mute"><Date :date="bookmark.createdAt" format="r" /></div>
                                </NuxtLink>
                            </template>
                        </div>
                    </Drawer>
                </div>
            </aside>
            <VolumeList
                v-if="canRead"
                :manga="data"
                :sort="params?.sort ?? 'ordinal'"
                :asc="params?.asc ?? true"
            />
        </main>
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { token } = useSettingsHelper();
const { proxy } = useMangaApi();
const { canRead } = useAuthApi();
const { data, error, pending, params, refresh, throttled, chapters } = useMangaCache();
const { pending: isPending } = useAsyncData(async () => await refresh());

const isLoading = computed(() => pending.value || isPending.value);
const title = computed(() => data.value?.manga.displayTitle ?? data.value?.manga.title ?? 'Manga Not Found');
const description = computed(() => data.value?.manga.description ?? 'Find your next binge on MangaBox!');
const cover = computed(() => proxy(data.value?.manga.cover ?? 'https://mangabox.app/broken.png'));

const bookmarks = computed(() => {
    if (!data.value?.bookmarks || !chapters.value) return [];

    return data.value.bookmarks.map(bookmark => {
        const chapter = chapters.value[bookmark.mangaChapterId];
        if (!chapter) return undefined;
        return {
            ...bookmark,
            chapter
        };
    }).filter((bookmark): bookmark is NonNullable<typeof bookmark> => bookmark !== undefined);
})

useHead({ title })

useServerSeoMeta({
    title, ogTitle: title,
    description, ogDescription: description,
    ogImage: cover, twitterCard: 'summary_large_image'
});

watch(() => route.params.id, () => throttled(false));
watch(() => route.query.asc, () => throttled(false));
watch(() => route.query.sort, () => throttled(false));

onMounted(() => setTimeout(() => nextTick(() => {
    if (!token.value) return;
    refresh(true);
}), 200));
</script>

<style scoped lang="scss">
.manga {
    position: unset;

    .manga-content {
        flex: 1;
        max-width: 1450px;
        margin: 0 auto;

        .details {
            position: relative;
            //margin: 5px;
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

            .details {
                width: unset;
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
