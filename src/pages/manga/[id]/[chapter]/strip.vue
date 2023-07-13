<template>
<Loading v-if="pending" />
<div v-else class="max-width flex row">
    <header class="flex center-items pad">
        <h2 class="fill">{{ manga?.title }}</h2>
        <button @click="() => downloadStrip()">
            <Icon>download</Icon>
        </button>
        <NuxtLink :to="`/manga/${id}/${firstChap}?page=${page}`">
            <Icon>arrow_back</Icon>
        </NuxtLink>
    </header>
    <main class="fill">
        <Tabs>
            <Tab title="Available Images" icon="add_photo_alternate" scrollable>
                <div class="tab-control pad">
                    <div class="control group no-top">
                        <SelectBox v-model="chapterId" fill>
                            <option v-for="chap in chapters" :value="chap.id">
                                Ch. {{ chap.ordinal }} - {{ chap.title }}
                            </option>
                        </SelectBox>
                        <button @click="() => prevChap()" :disabled="!prevChapId">
                            <Icon unsize="true" size="26px">skip_previous</Icon>
                        </button>
                        <button @click="() => nextChap()" :disabled="!nextChapId">
                            <Icon unsize="true" size="26px">skip_next</Icon>
                        </button>
                    </div>

                    <div class="images grid responsive">
                        <div class="image clickable" v-for="page of pageUrls" :class="state(page)" @click="() => toggle(page)">
                            <img :src="page.proxied" />
                        </div>
                    </div>
                </div>
                
            </Tab>
            <Tab title="Selected Image" icon="my_location" scrollable>
                <div class="tab-control pad">
                    <ClientOnly>
                        <draggable v-model="selected" item-key="id" tag="div" :component-data="{class: 'images grid responsive'}">
                            <template #item="{element: page}">
                                <div class="image">
                                    <img :src="page.proxied" />
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
                    </ClientOnly>
                </div>
            </Tab>
        </Tabs>
    </main>
</div>
</template>

<script setup lang="ts">
const route = useRoute();
const { proxy, clone, toPromise } = useApiHelper();
const { fetch, pages, strip } = useMangaApi();

type Selected = {
    id: string;
    page: number;
    chapter: number;
    url: string;
    proxied: string;
};

const DEFAULT_IMAGE = '/broken.png';
const firstChap = +(route.params.chapter?.toString() || '0');
let _chapterId = ref(firstChap);

const page = computed(() => +(route.query.page?.toString() || '1'));
const id = computed(() => route.params.id.toString());
const chapterId = computed({
    get: () => _chapterId.value,
    set: (value: number) => {
        _chapterId.value = value;
        checkPages();
    }
})

const { data, pending } = await fetch(id.value);
const manga = computed(() => data.value?.manga);
const chapters = computed(() => data.value?.chapters || []);
const chapter = computed(() => chapters.value.find(t => t.id === chapterId.value));
const chapterIndex = computed(() => chapters.value.findIndex(t => t.id === chapterId.value));
const pageUrls = computed(() => 
    !manga.value || !chapter.value 
        ? []  
        : chapter.value.pages.map((t, i) => {
            return <Selected>{
                proxied: proxy(t, 'manga-page', manga.value?.referer),
                page: i + 1,
                chapter: chapterId.value,
                url: t,
                id: `${chapterId.value}-${i + 1}`
            }
        }));
const firstPage = computed(() => pageUrls.value[page.value - 1] || DEFAULT_IMAGE);
const selected = ref<Selected[]>([]);
const name = computed(() => (manga.value?.title ?? 'strip').replace(/[/\\?%*:|"<>]/g, '-') + ".png");

const prevChapId = computed(() => chapters.value[chapterIndex.value - 1]?.id);
const nextChapId = computed(() => chapters.value[chapterIndex.value + 1]?.id);

const nextChap = () => { if (nextChapId.value) chapterId.value = nextChapId.value; };
const prevChap = () => { if (prevChapId.value) chapterId.value = prevChapId.value; };

const move = (page: Selected, increment: number) => {
    const index = selected.value.findIndex(t => t.chapter == page.chapter && t.page == page.page);
    if (index === -1) return;

    let next = index + increment;
    if (next < 0) next = selected.value.length - 1;
    if (next >= selected.value.length) next = 0;
    if (next === index) return;

    [selected.value[index], selected.value[next]] = [selected.value[next], selected.value[index]];
}

const downloadStrip = async () => {
    if (!manga.value || selected.value.length === 0) return;

    pending.value = true;
    await strip(manga.value.id, selected.value.map(t => {
        return {
            chapterId: t.chapter,
            page: t.page
        }
    }), name.value);
    pending.value = false;
};

const toggle = (select: Selected) => {
    const i = selected.value.findIndex(t => t.page === select.page && t.chapter === select.chapter);
    if (i === -1) {
        selected.value.push(clone(select));
        return;
    }

    selected.value.splice(i, 1);
}

const state = (select: Selected) => {
    const i = selected.value.findIndex(t => t.page === select.page && t.chapter === select.chapter);
    return i === -1 ? 'none' : 'selected';
}

const checkPages = async () => {
    if (!chapter.value || chapter.value.pages.length > 0) return;

    pending.value = true;
    const output = await toPromise(pages(id.value, chapterId.value));
    chapter.value.pages = output ?? [];
    chapterId.value = chapterId.value;
    pending.value = false;
}

watch(() => data.value, () => {
    if (!data.value || selected.value.length !== 0) return;
    selected.value.push(clone(firstPage.value));
});
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