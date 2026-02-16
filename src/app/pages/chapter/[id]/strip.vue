<template>
    <Loading v-if="isLoading" />
    <div v-else class="max-width flex row">
        <header class="flex center-items pad">
            <h2 class="fill">{{ mangaExtended?.displayTitle ?? manga?.title ?? 'Where\'d the manga go?' }}</h2>
            <button @click="() => downloadStrip()">
                <Icon>download</Icon>
            </button>
            <NuxtLink :to="`/chapter/${chapter?.id}?page=${page}`">
                <Icon>arrow_back</Icon>
            </NuxtLink>
        </header>
        <main class="fill">
            <Tabs>
                <Tab title="Available Images" icon="add_photo_alternate" scrollable>
                    <div class="tab-control pad">
                        <div class="control group no-top">
                            <SelectBox v-model="chapterId" fill>
                                <optgroup
                                    v-for="volume in volumes?.volumes ?? []"
                                    :label="volume.ordinal ? `Volume ${volume.ordinal}` : 'No Volume'"
                                >
                                    <template v-for="chapter in volume.chapters">
                                        <template
                                            v-if="chapter.versions.length === 1 && volumes?.chapters[chapter.versions[0]!]?.chapter"
                                        >
                                            <option
                                                :value="chapter.versions[0]"
                                            >
                                                {{ chapterTitle(volumes?.chapters[chapter.versions[0]!]!.chapter!) }}
                                            </option>
                                        </template>
                                        <template
                                            v-else-if="chapter.versions.length > 1"
                                            v-for="(version, index) in chapter.versions"
                                        >
                                            <option
                                                :value="version"
                                            >
                                                {{ chapterTitle(volumes?.chapters[version]!.chapter!) }} - Ver. {{ index + 1 }}
                                            </option>
                                        </template>
                                    </template>
                                </optgroup>
                            </SelectBox>
                            <button @click="() => prevChapter()" :disabled="!prevChapId">
                                <Icon unsize="true" size="26px">skip_previous</Icon>
                            </button>
                            <button @click="() => nextChapter()" :disabled="!nextChapId">
                                <Icon unsize="true" size="26px">skip_next</Icon>
                            </button>
                        </div>

                        <div class="images grid responsive">
                            <Loading v-if="pagesLoading" inline />
                            <div
                                class="image clickable"
                                v-for="page of pages"
                                :class="state(page)"
                                @click="() => toggle(page)"
                            >
                                <img :src="api.promise.image.downloadUrl(page.pageId)" />
                            </div>
                        </div>
                    </div>

                </Tab>
                <Tab title="Selected Image" icon="my_location" scrollable>
                    <div class="tab-control pad">
                        <draggable v-model="selected" item-key="id" tag="div" :component-data="{class: 'images grid responsive'}">
                            <template #item="{element: page}">
                                <div class="image">
                                    <img :src="api.promise.image.downloadUrl(page.pageId)" />
                                    <div class="floating-btns">
                                        <button @click="() => toggle(page)">
                                            <Icon>delete</Icon>
                                        </button>
                                        <button @click="() => move(page, -1)">
                                            <Icon>skip_previous</Icon>
                                        </button>
                                        <button @click="() => move(page, 1)">
                                            <Icon>skip_next</Icon>
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </Tab>
            </Tabs>
        </main>
    </div>
</template>

<script setup lang="ts">
type SelectedPage = {
    pageId: string;
    pageOrdinal: number;
    chapterId: string;
}

const route = useRoute();
const { canRead } = useAuthHelper();
const { chapterTitle } = useMangaUtils();
const { fetch, manga, mangaExtended, chapter, pending, volumes, getPages } = useReaderHelper();
const api = useMangaApi();
const { download } = useApiHelper();

const selected = ref<SelectedPage[]>([]);
const chapterId = ref<string>(route.params.id?.toString() ?? '');
const pages = ref<SelectedPage[]>([]);
const pagesLoading = ref(false);
const downloading = ref(false);
const page = computed(() => +(route.query.page?.toString() ?? '1'));
const name = computed(() => (mangaExtended.value?.displayTitle ?? manga.value?.title ?? 'strip').replace(/[/\\?%*:|"<>]/g, '-') + ".png");

const nextChapId = computed(() => {
    if (!chapter.value || !volumes.value) return;

    let isCurrent = false;
    for(const vol of volumes.value.volumes) {
        for (const chap of vol.chapters) {
            if (isCurrent) {
                return chap.versions[0];
            }

            if (chap.versions[0] === chapter.value?.id) {
                isCurrent = true;
            }
        }
    }
});

const prevChapId = computed(() => {
    if (!chapter.value || !volumes.value) return;

    let prev: string | undefined;
    for(const vol of volumes.value.volumes) {
        for (const chap of vol.chapters) {
            if (chap.versions[0] === chapter.value?.id) {
                return prev;
            }

            prev = chap.versions[0];
        }
    }
});

const { pending: apiLoading } = useAsyncData(
    `chapter-strip-${route.params.id}-fetch`,
    async () => await fetch(), {
    watch: [() => route.params, () => route.query, () => canRead.value],
});

const isLoading = computed(() => pending.value || apiLoading.value || downloading.value);

const downloadStrip = async () => {
    if (!selected.value.length) return;

    downloading.value = true;
    const url = api.promise.image.stripUrl(selected.value.map(p => p.pageId));
    await download(url, name.value);
    downloading.value = false;
}

const nextChapter = () => {
    if (!nextChapId.value) return;
    chapterId.value = nextChapId.value;
}

const prevChapter = () => {
    if (!prevChapId.value) return;
    chapterId.value = prevChapId.value;
}

const state = (page: SelectedPage) => {
    if (selected.value.find(p => p.pageId === page.pageId)) return 'selected';
    return 'none';
};

const toggle = (page: SelectedPage) => {
    const index = selected.value.findIndex(p => p.pageId === page.pageId);
    if (index !== -1) {
        selected.value.splice(index, 1);
        return;
    }

    selected.value.push(page);
}

const move = (page: SelectedPage, increment: number) => {
    const index = selected.value.findIndex(t => t.pageId == page.pageId);
    if (index === -1) return;

    let next = index + increment;
    if (next < 0) next = selected.value.length - 1;
    if (next >= selected.value.length) next = 0;
    if (next === index) return;

    [selected.value[index]!, selected.value[next]!] = [selected.value[next]!, selected.value[index]!];
}

watch(chapterId, async (newId, oldId) => {
    if (!newId) return;

    pagesLoading.value = true;
    const pagesData = await getPages(newId);
    pagesLoading.value = false;
    if (!pagesData) return;

    pages.value = pagesData.map(t => ({
        pageId: t.id,
        pageOrdinal: t.ordinal,
        chapterId: newId,
    }));

    if (oldId) return;

    const currentPage = pages.value.find(p => p.pageOrdinal === page.value);
    if (!currentPage) return;

    toggle(currentPage);
}, { immediate: true });

</script>

<style lang="scss" scoped>
.tab-control {
    .images {
        margin-top: var(--margin);
        .image {
            overflow: hidden;
            position: relative;
            display: flex;
            border-radius: var(--margin);
            border: 2px solid transparent;

            img {
                max-width: 100%;
                margin: auto 0;
            }

            .floating-btns {
                position: absolute;
                top: 0;
                right: 0;
                display: flex;
                flex-flow: column;

                button {
                    height: 36px;
                    margin: calc(var(--margin) / 2);
                    background-color: var(--bg-color-accent-dark);
                    padding: calc(var(--margin) / 2);
                    border-radius: 50%;
                    color: #fff;
                }
            }

            &.selected { border-color: var(--color-success); }

            &.clickable:hover {
                cursor: pointer;
                filter: brightness(0.8) grayscale(0.8);
            }

            &:not(.clickable):hover {
                cursor: grab;
                filter: brightness(0.8) grayscale(0.8);
            }
        }
    }
}
</style>
