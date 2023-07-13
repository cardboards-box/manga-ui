<template>
<Loading v-if="pending" />
<Error v-else-if="error" :message="error?.message" />
<div v-else class="manga-details flex fill-parent scroll-y">
    <div v-if="manga" class="manga-header flex row">
        <Cover :manga="manga" type="background" width="100%" height="400px" />
        <a class="title" :href="manga.url" target="_blank">{{ manga.title }}</a>
        <div class="buttons flex center-horz">
            <IconBtn 
                v-if="resumeUrl" 
                breakpoint 
                :link="resumeUrl" 
                icon="play_arrow" 
                text="Resume" 
                color="shade" 
            />
            <IconBtn 
                v-if="isRandom" 
                breakpoint 
                @click="nextRandom" 
                icon="shuffle" 
                text="Next Random Manga"
                color="shade" 
            />
            <IconBtn 
                v-if="stats && currentUser" 
                breakpoint 
                :fill="isFavourite" 
                @click="toggleFavourite"
                :loading="reloading" 
                icon="star" 
                :text="isFavourite ? 'Unfavourite' : 'Favourite'" 
                color="shade" 
            />
            <IconBtn 
                v-if="progress && currentUser" 
                :loading="reloading" 
                @click="resetProgress" 
                breakpoint 
                icon="delete"
                text="Reset Progress" 
                color="shade" 
            />
            <IconBtn 
                v-if="currentUser" 
                :loading="reloading" 
                @click="reloadSource" 
                breakpoint 
                icon="sync"
                text="Reload Source" 
                color="shade" 
            />
            <IconBtn 
                @click="copyUrl" 
                breakpoint 
                icon="content_copy" 
                text="Copy Manga Url" 
                color="shade" 
            />
            <IconBtn
                v-if="currentUser"
                @click="toggleReadAll"
                breakpoint
                :loading="reloading"
                :icon="progress && progress.read.length > 0 ? 'visibility_off' : 'visibility'"
                :text="progress && progress.read.length > 0 ? 'Mark all as Unread' : 'Mark all as Read'"
                color="shade" 
            />
        </div>
        <div class="drawers">
            <Drawer title="Progress" v-if="stats && progress && currentVersion">
                <p>
                    <b>Chapter: </b>
                    <span v-if="currentVersion.volume">Vol. {{ currentVersion.volume }}&nbsp;</span> Ch. {{
                        currentVersion.ordinal }} - {{ currentVersion.title }}
                </p>
                <p>
                    <b>Progress: </b>
                    {{ stats.chapterProgress }}%
                </p>
                <p>
                    <b>Page Progress: </b>
                    {{ stats.pageProgress }}%
                </p>
                <p>
                    <b>Last Read On: </b>
                    <Date :date="progress.updatedAt.toString()" />
                </p>
                <p>
                    <b>Favourite: </b>
                    {{ isFavourite ? 'Yes' : 'No' }}
                </p>
                <p>
                    <b>Completed: </b>
                    {{ stats.completed ? 'Yes' : 'No' }}
                </p>
            </Drawer>
            <Drawer title="Description" v-if="manga.description">
                <Markdown :content="manga.description" />
            </Drawer>
            <Drawer title="More Details">
                <div class="tags">
                    <span>Alternate Titles</span>
                    <span v-for="tag in manga.altTitles">{{ tag }}</span>
                </div>
                <div class="tags in-line">
                    <span>Tags </span>
                    <span v-if="manga.nsfw" class="warning">Nsfw</span>
                    <NuxtLink v-for="tag in manga.tags" :to="'/search/all?include=' + tag">{{ tag }}</NuxtLink>
                </div>
                <div class="tags in-line">
                    <span>Details </span>
                    <span v-for="tag in manga.attributes">
                        <b>{{ tag.name }}</b>: {{ tag.value }}
                    </span>
                </div>
            </Drawer>
        </div>
    </div>

    <VolumeList :sort="sort" :asc="asc" :manga="data" :progress="progress" />
</div>
</template>

<script setup lang="ts">
import { VolumeSort } from '~/models';

const {
    volumed,
    favourite,
    reload,
    resetProgress: reset,
    markAsRead
} = useMangaApi();

const { proxy: proxyUrl, toPromise, clone } = useApiHelper();
const { currentUser } = useAuthApi();
const route = useRoute();

const rawId = computed(() => route.params.id.toString());
const sort = computed(() => <VolumeSort | undefined>route.query?.sort?.toString() ?? 'ordinal');
const asc = computed(() => (route.query?.asc?.toString()?.toLowerCase() ?? 'true') === 'true');
const isRandom = computed(() => rawId.value === 'random');

const params = ref({ sort: sort.value, asc: asc.value });
const unauthed = !currentUser.value;
const { data: rawData, pending: reloading, error, refresh } = await volumed(rawId.value, params);
const data = ref(clone(rawData.value));
const pending = computed(() => data.value ? false : reloading.value);
const manga = computed(() => data.value?.manga);
const isFavourite = computed(() => stats.value?.favourite || false);
const id = computed(() => manga.value?.id || 0);
const volumes = computed(() => data.value?.volumes ?? []);
const stats = computed(() => data.value?.stats);
const progress = computed(() => data.value?.progress);

const proxy = (url: string) => proxyUrl(url, 'manga-cover', manga.value?.referer);

const allCollapsed = computed(() => !!volumes.value.find(t => !t.collapse));
const currentVolume = computed(() => volumes.value[data.value?.volumeIndex ?? 0]);
const currentChapter = computed(() =>
    currentVolume.value?.chapters.find(t => t.progress !== null && t.progress !== undefined)
    ?? currentVolume.value?.chapters[0]);
const currentVersion = computed(() => currentChapter.value?.versions[currentChapter.value?.readIndex ?? 0]);
const resumeUrl = computed(() =>
    progress?.value
        ? `/manga/${manga.value?.id}/${progress.value.mangaChapterId}?page=${(progress.value.pageIndex ?? 0) + 1}`
        : undefined
);
const title = computed(() => manga.value?.title ?? 'Manga Not Found');
const description = computed(() => manga.value?.description ?? 'Find your next binge on MangaBox!');
const cover = computed(() => proxy(manga.value?.cover ?? 'https://cba.index-0.com/assets/broken.webp'));

useHead({ title })

useServerSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage: cover,
    twitterCard: 'summary_large_image'
});

const toggleVolume = (index: number) => {
    volumes.value[index].collapse = !volumes.value[index].collapse;
}

const volumeCollapsed = (index: number) => volumes.value[index].collapse;

const collapseToggle = () => {
    const collapse = allCollapsed.value;
    for (let vol of volumes.value)
        vol.collapse = collapse;
};

const toggleFavourite = async () => {
    if (!id.value) return;
    await toPromise(favourite(id.value));
    await refetch();
}

const reloadSource = async () => {
    if (!manga.value) return;
    reloading.value = true;

    await toPromise(reload(manga.value));
    await refetch();
    reloading.value = false;
}

const refetch = () => {
    if (rawData.value && data.value) {
        rawData.value.stats = undefined;
        rawData.value.progress = undefined;
        rawData.value.chapter = undefined;
        data.value.volumes = [];
    }

    return refresh();
}

const resetProgress = async () => {
    reloading.value = true;
    await toPromise(reset(id.value));
    await refetch();
}

const copyUrl = () => {
    const baseUrl = `${window.location.protocol}//${window.location.host}/manga/${id.value}`;
    navigator.clipboard.writeText(baseUrl);
}

const nextRandom = async () => {
    if (!isRandom) return;

    await refetch();
}

const url = (s?: VolumeSort, a?: boolean) => {
    return `/manga/${id.value}?sort=${s ?? sort.value}&asc=${a ?? asc.value}`;
}

const toggleReadAll = async () => {
    if (!manga.value || !currentUser.value) return;

    reloading.value = true;
    await toPromise(markAsRead(id.value));
    await refetch();
}

onMounted(() => nextTick(() => {

    watch(() => id.value, () => {
        if (id.value && unauthed) refetch();
    }, { immediate: true });

    watch(() => rawData.value, () => {
        if (rawData.value) data.value = clone(rawData.value);
    });

    watch(() => route.query, () => {
        if (sort.value === params.value.sort && asc.value == params.value.asc) return;

        params.value = {
            sort: sort.value,
            asc: asc.value
        };
    }, { deep: true });
}));
</script>

<style lang="scss" scoped>
$bg-color: var(--bg-color-accent);

.manga-details {
    position: unset;

    .manga-header {
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

            button,
            a {
                margin: 5px;

                p { display: none; }
            }
        }
    }

    .volumes {
        position: relative;
        margin: 5px 5px 5px 5px;

        .chapter-header {
            border-radius: var(--brd-radius);
            background-color: $bg-color;

            p {
                margin: auto 5px;
                padding: 7.5px 0;
            }
        }

        .volume {
            display: flex;
            flex-flow: column;
            position: relative;
            margin: 10px 0;

            .collapse-btn {
                position: absolute;
                top: 0;
                right: 0;
                transform: translateY(-50%);
            }

            .name {
                position: absolute;
                top: 50%;
                left: 5px;
                transform: rotate(-90deg) translateX(-37%);
                transform-origin: left;
                cursor: pointer;
            }

            .chapters {
                margin-left: 5px;
                display: flex;
                flex-flow: column;
                border-left: 3px solid #{$bg-color};
                border-top-left-radius: 10px;
                border-bottom-left-radius: 10px;
                padding: 10px;

                .chapter-collapse,
                .version-chapter {
                    padding: 15px;
                    background-color: $bg-color;
                    text-decoration: none;
                    margin: 5px;
                    position: relative;

                    &:first-child {
                        display: none;
                    }

                    &.resume {
                        background-color: var(--accent-1);
                    }
                }

                &.collapse {
                    .chapter-collapse:first-child {
                        display: grid;
                    }

                    .chapter-collapse:not(:first-child),
                    .version-chapter:not(:first-child) {
                        display: none;
                    }
                }
            }
        }
    }
}

@media only screen and (max-width: 1050px) {
    .manga-details {
        flex-flow: column;

        .manga-header {
            width: unset;
            flex: 1;
        }
    }
}

@media only screen and (max-width: 400px) {
    .manga-details .manga-header .buttons {
        margin: 5px;
        flex-flow: column;

        button,
        a {
            flex: 1;

            p {
                display: block;
                margin-left: 10px;
            }
        }
    }
}
</style>