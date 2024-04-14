<template>
    <div class="reader-settings flex row" :class="classes">
        <div class="floating-image"  />
        <header class="flex center-items">
            <button @click="() => menuOpen = !menuOpen">
                <Icon>close</Icon>
            </button>
            <NuxtLink :to="'/manga/' + manga?.id" class="flex fill center-items text-center">
                {{ manga?.displayTitle ?? manga?.title }}
            </NuxtLink>
        </header>
        <article class="fill">
            <Tabs flip>
                <Tab icon="info" scrollable keep-alive class-name="flex row">
                    <div class="settings-tab flex row">
                        <img
                            v-if="manga?.cover"
                            :src="proxy(manga.cover, 'manga-cover', manga.referer)"
                            class="rounded"
                        />
                        <h3 v-if="manga?.title" class="margin-top">
                            {{ manga.title }}
                        </h3>
                        <p>
                            <b>Manga Progress: </b>&nbsp;
                            {{ (((volumeIndex + 1) / volumes.length) * 100).toFixed(2) }}%
                        </p>
                        <p>
                            <b>Volume Progress: </b>&nbsp;
                            {{ (((chapterIndex + 1) / (volume?.chapters ?? []).length) * 100).toFixed(2) }}%
                        </p>
                        <p>
                            <b>Chapter Progress: </b>&nbsp;
                            {{ (page / (chapter?.pages?.length ?? 1) * 100).toFixed(2) }}%
                        </p>

                        <template v-for="attr of chapter?.attributes">
                            <p v-if="isLink(attr.value)">
                                <a :href="attr.value" target="_blank">
                                    <b>{{ attr.name }}</b>
                                </a>
                            </p>
                            <p v-else-if="attr.name === 'Scanlation Discord'">
                                <a
                                    :href="'https://discord.gg/' + attr.value"
                                    target="_blank"
                                >
                                    <b>Scanlation Discord</b>
                                </a>
                            </p>
                            <p v-else>
                                <b>{{ attr.name }}:</b> {{ attr.value }}
                            </p>
                        </template>

                        <ReaderSelect :loading="loading" />

                        <div class="btn-group">
                            <NuxtLink
                                :class="{ 'disabled': !prevChapterLink }"
                                :to="prevChapterLink"
                            >
                                <Icon>skip_previous</Icon>
                            </NuxtLink>
                            <NuxtLink
                                :class="{ 'disabled': !prevPageLink }"
                                :to="prevPageLink"
                                v-if="pageStyle !== PageStyle.LongStrip"
                            >
                                <Icon>navigate_before</Icon>
                            </NuxtLink>
                            <NuxtLink :to="genLink('ChapterStart')">
                                <Icon>restart_alt</Icon>
                            </NuxtLink>
                            <NuxtLink
                                :class="{ 'disabled': !nextPageLink }"
                                :to="nextPageLink"
                                v-if="pageStyle !== PageStyle.LongStrip"
                            >
                                <Icon>navigate_next</Icon>
                            </NuxtLink>
                            <NuxtLink
                                :class="{ 'disabled': !nextChapterLink }"
                                :to="nextChapterLink"
                            >
                                <Icon>skip_next</Icon>
                            </NuxtLink>
                        </div>
                        <div class="btn-group-vert">
                            <button @click="copyUrl(`manga/${id}/${chapterId}?page=${page}`)">
                                <Icon>auto_stories</Icon>
                                <p>Copy Page Link</p>
                            </button>
                            <button @click="copyUrl('manga/' + id)">
                                <Icon>share</Icon>
                                <p>Copy Manga Link</p>
                            </button>
                            <NuxtLink :to="'/manga/' + id">
                                <Icon>menu_book</Icon>
                                <p>Manga Home page</p>
                            </NuxtLink>
                            <a :href="manga?.url" target="_blank">
                                <Icon>home</Icon>
                                <p>Manga Source Page</p>
                            </a>
                            <button :disabled="downloading" @click="downloadData(pageUrl)">
                                <Icon :spin="downloading">
                                    {{ !downloading ? 'download' : 'sync' }}
                                </Icon>
                                <p>Download Page</p>
                            </button>
                            <button :disabled="downloading" @click="downloadData(chapterUrl)">
                                <Icon :spin="downloading">
                                    {{ !downloading ? 'download_for_offline' : 'sync' }}
                                </Icon>
                                <p>Download Chapter</p>
                            </button>
                            <NuxtLink :to="`/manga/${id}/${chapterId}/strip?page=${page}`">
                                <Icon>auto_fix</Icon>
                                <p>Create Strip</p>
                            </NuxtLink>
                            <NuxtLink :to="genLink('ChapterStart')">
                                <Icon>restart_alt</Icon>
                                <p>Restart Chapter</p>
                            </NuxtLink>
                            <button :disabled="bookmarking" @click="toggleBookmark">
                                <Icon :spin="bookmarking">bookmark</Icon>
                                <p>Bookmark Page</p>
                            </button>
                        </div>
                    </div>
                </Tab>
                <Tab icon="settings" scrollable keep-alive class-name="flex row">
                    <div class="settings-tab flex row">
                        <h3>Settings</h3>
                        <div class="control checkbox">
                            <CheckBox v-model="invertControls">
                                Invert Page Controls
                            </CheckBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="forwardOnly">
                                No Directional Buttons
                            </CheckBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="pageMenuOver">
                                Page Menu Over Content
                            </CheckBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="showTutorial">
                                Show Page Tutorial
                            </CheckBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Progress Bar Style</label>
                            <SelectBox v-model="progressBar">
                                <option
                                    v-for="style in PROGRESS_BAR_STYLES"
                                    :value="style.value"
                                >
                                    {{ style.display }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Scroll amount on key event</label>
                            <input
                                type="number"
                                min="0"
                                max="1000"
                                step="10"
                                v-model="scrollAmount"
                            />
                        </div>
                        <div class="control">
                            <label class="no-bot">Click Region Margin</label>
                            <input
                                type="number"
                                min="5"
                                max="90"
                                step="5"
                                v-model="regionMargin"
                            />
                        </div>
                        <div class="control">
                            <label class="no-bot">Image Style</label>
                            <SelectBox v-model="pageStyle">
                                <option v-for="style in PAGE_STYLES" :value="style.value">
                                    {{ style.display }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Image Filter</label>
                            <SelectBox v-model="filter">
                                <option v-for="style in FILTER_STYLES" :value="style.value">
                                    {{ style.display }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control" v-if="filter === FilterStyle.Custom">
                            <label class="no-bot">Custom Filter</label>
                            <input
                                type="text"
                                v-model="customFilter"
                                placeholder="Custom CSS filter"
                            />
                        </div>
                        <div class="control">
                            <label class="no-bot">Image Brightness ({{ brightness }}%)</label>
                            <input type="range" min="1" max="100" step="1" v-model="brightness" />
                        </div>
                        <div class="btn-group-vert">
                            <button @click="fullscreen">
                                <Icon>fullscreen</Icon>
                                <p>Toggle Fullscreen</p>
                            </button>
                            <button @click="resetPages">
                                <Icon>sync</Icon>
                                <p>Refresh Page Links</p>
                            </button>
                        </div>
                    </div>
                </Tab>
                <!-- <Tab
                    v-if="bookmarks.length > 0"
                    icon="bookmark"
                    scrollable
                    keep-alive
                    class-name="flex row"
                >
                    <template v-for="bookmark in bookmarks">
                    <NuxtLink
                        class="bookmark"
                        v-for="p of bookmark.pages"
                        :to="genLink('Page', p, bookmarkChapter(bookmark)?.id)"
                    >
                        <img
                            :src="bookmarkImage(bookmark, p)"
                            :style="{ 'filter': imageFilter }"
                        />
                        <div class="details">
                            <p>Ch. {{ bookmarkChapter(bookmark)?.ordinal }} Pg. {{ p }}</p>
                            <p>Last Updated: <Date :date="bookmark.createdAt" /></p>
                        </div>
                    </NuxtLink>
                    </template>
                </Tab> -->
            </Tabs>
        </article>
    </div>
</template>

<script setup lang="ts">
import {
    PAGE_STYLES, PageStyle,
    PROGRESS_BAR_STYLES,
    FilterStyle, FILTER_STYLES
} from '~/models';
import type { ClassOptions } from '~/models';
const DEFAULT_IMAGE = '/broken.png';
const { fullscreen, serClasses } = useUtils();
const { apiUrl } = useSettingsHelper();
const { resetPages: reset, bookmark } = useMangaApi();
const { proxy, download } = useApiHelper();
const { data, refresh, genLink } = useReaderHelper();
const {
    invertControls, forwardOnly,
    brightness, pageStyle, filterStyle: filter,
    customFilter, progressBarStyle: progressBar,
    scrollAmount, showTutorial,
    pageMenuOver, regionMargin
} = useAppSettings();

const props = defineProps<{
    loading: boolean;
    modelValue: boolean;
    'class'?: ClassOptions
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const menuOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emits('update:modelValue', value)
})

const downloading = ref(false);
const bookmarking = ref(false);
const pageLoading = ref(false);

const manga = computed(() => data.value?.manga);
const id = computed(() => manga.value?.id);
const chapterId = computed(() => data.value?.chapterId);
const bookmarks = computed(() => data.value?.volumed.stats?.bookmarks ?? []);
const page = computed(() => (data.value?.pageIndex ?? 0) + 1);
const chapterUrl = computed(() => `${apiUrl}/manga/${id.value}/${chapterId.value}/download`);
const pageUrl = computed(() => data.value?.page ?? DEFAULT_IMAGE);
const volumes = computed(() => data.value?.volumed.volumes ?? []);
const volumeIndex = computed(() => data.value?.volumeIndex ?? 0);
const volume = computed(() => data.value?.volume);
const chapterIndex = computed(() => data.value?.chapterIndex ?? 0);
const chapter = computed(() => data.value?.version);
const classes = computed(() => serClasses(props.class, { 'open': menuOpen.value }));

const prevChapterLink = computed(() => genLink('PrevChapter'));
const nextChapterLink = computed(() => genLink('NextChapter'));
const prevPageLink = computed(() => genLink('PrevPage'));
const nextPageLink = computed(() => genLink('NextPage'));

const isLink = (url: string) => url.toLowerCase().startsWith('http');

const resetPages = async () => {
    if (!id.value || !chapterId.value) return;

    pageLoading.value = true;
    await reset(id.value, chapterId.value);
    await refresh();
    pageLoading.value = false;
};

const toggleBookmark = async () => {
    if (!id.value || !chapter.value) return;
    bookmarking.value = true;

    const pages = bookmarks.value;

    const i = pages.indexOf(page.value);
    if (i === -1) {
        pages.push(page.value);
    } else {
        pages.splice(i, 1);
    }

    await bookmark(id.value, chapter.value.id, pages);
    await refresh();

    bookmarking.value = false;
}

const downloadData = async (url: string, name?: string) => {
    downloading.value = true;
    await download(url, name);
    downloading.value = false;
}

const copyUrl = (url: string) => {
    navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/${url}`);
}
</script>

<style scoped lang="scss">
$navwidth: 400px;
@mixin page-menu-over {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 2;
    overflow: hidden;

    .floating-image {
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        background-image: var(--bg-image);
        background-position: var(--bg-image-position);
        background-size: var(--bg-image-size);
        background-repeat: var(--bg-image-repeat);
        filter: var(--bg-image-filter);
        transform: scale(1.1);
    }
}

.reader-settings {
    width: $navwidth;
    margin-right: $navwidth * -1;
    transition: all 150ms;
    max-width: 100vw;
    background-color: var(--bg-color-accent);

    header {
        margin: 10px;
        margin-bottom: 0;
        overflow: hidden;

        button { height: 24px; }

        a {
            overflow: hidden;
            overflow: hidden;
            white-space: pre;
            text-overflow: ellipsis;
        }
    }

    .settings-tab {
        padding: 0 3px;
        img {
            max-height: 300px;
            margin: 0 auto;
        }


        h3 {
            white-space: pre;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        a { text-decoration: underline; }
    }

    .bookmark {
        display: flex;
        flex-flow: row;
        padding: var(--margin);
        border-radius: var(--margin);

        img {
            width: 50px;
            border-radius: var(--margin);
        }

        .details {
            flex: 1;
            display: flex;
            flex-flow: column;
            margin: auto 5px;
            border-right: 1px solid transparent;
        }

        &:hover {
            background-color: var(--bg-color-accent);
        }
    }

    &.open { margin-right: 0; }
    &.over { @include page-menu-over();  }
}

@media only screen and (max-width: 600px) {
    .reader-settings { @include page-menu-over(); }
}
</style>
