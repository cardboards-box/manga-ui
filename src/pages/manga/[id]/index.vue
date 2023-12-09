<template>
    <Loading v-if="isLoading" />
    <Error v-else-if="error || !data" :error="error ?? 'Manga Not Found'" />
    <div v-else class="manga flex fill-parent scroll-y">
        <main class="manga-content flex">
            <aside class="details flex row">
                <Cover :manga="data.manga" type="background" width="100%" height="400px" />
                <a class="title" :href="data.manga.url" target="_blank">{{ title }}</a>
                <div class="drawers margin-top">
                    <MangaProgress :manga="data" />
                    <Drawer title="Description" v-if="description">
                        <Markdown :content="description" />
                    </Drawer>
                    <Drawer title="More Details">
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
                </div>
            </aside>
            <VolumeList :manga="data" :sort="params?.sort ?? 'ordinal'" :asc="params?.asc ?? true" />
        </main>
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { token } = useSettingsHelper();
const { proxy } = useApiHelper();
const { data, error, pending, params, refresh, unauthed, throttled } = useMangaCache();
const { pending: isPending } = useAsyncData(async () => await refresh());

const isLoading = computed(() => pending.value || isPending.value);
const title = computed(() => data.value?.manga.displayTitle ?? data.value?.manga.title ?? 'Manga Not Found');
const description = computed(() => data.value?.manga.description ?? 'Find your next binge on MangaBox!');
const cover = computed(() => proxy(data.value?.manga.cover ?? 'https://cba.index-0.com/assets/broken.webp'));

useHead({ title })

useServerSeoMeta({
    title, ogTitle: title,
    description, ogDescription: description,
    ogImage: cover, twitterCard: 'summary_large_image'
});

watch(() => route.params.id, () => throttled());
watch(() => route.query.asc, () => throttled());
watch(() => route.query.sort, () => throttled());

onMounted(() => setTimeout(() => {
    if (unauthed.value && token.value) {
        refresh(true);
        return;
    }
}, 200));
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
            margin: 5px;
            width: 430px;
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
