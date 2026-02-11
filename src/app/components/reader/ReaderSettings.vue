<template>
    <div class="reader-settings flex row" :class="classes">
        <div class="floating-image"  />
        <header class="flex center-items">
            <button @click="() => menuOpen = !menuOpen">
                <Icon>close</Icon>
            </button>
            <NuxtLink :to="'/manga/' + manga?.id" class="flex fill center-items text-center">
                {{ mangaExtended?.displayTitle ?? manga?.title }}
            </NuxtLink>
        </header>
        <article class="fill">
            <Tabs flip>
                <Tab icon="info" scrollable keep-alive class-name="flex row">
                    <div class="settings-tab flex row">
                        <Cover v-if="cover" :image="cover" type="img" />
                        <h3 class="margin-top">
                            {{ mangaExtended?.displayTitle ?? manga?.title ?? 'Manga Not Found' }}
                        </h3>

                        <ProgressBar
                            :percent="stats?.total ?? 0"
                            icon="shelves"
                            label="Total Progress"
                            :side-label="stats?.totalSlug"
                        />

                        <ProgressBar
                            :percent="stats?.manga ?? 0"
                            icon="book_5"
                            label="Volumes Read"
                            :side-label="stats?.mangaSlug"
                        />

                        <ProgressBar
                            :percent="stats?.volume ?? 0"
                            icon="menu_book"
                            label="Volume Progress"
                            :side-label="stats?.volumeSlug"
                        />

                        <ProgressBar
                            :percent="stats?.chapter ?? 0"
                            icon="auto_stories"
                            label="Pages Read"
                            :side-label="stats?.chapterSlug"
                        />

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
                            <button @click="() => goPrev('chapter')" title="Previous Chapter">
                                <Icon>skip_previous</Icon>
                            </button>
                            <button @click="() => goPrev('page')" title="Previous Page">
                                <Icon>navigate_before</Icon>
                            </button>
                            <button @click="() => goStart()" title="Restart Chapter">
                                <Icon>restart_alt</Icon>
                            </button>
                            <button @click="() => goNext('page')" title="Next Page">
                                <Icon>navigate_next</Icon>
                            </button>
                            <button @click="() => goNext('chapter')" title="Next Chapter">
                                <Icon>skip_next</Icon>
                            </button>
                        </div>
                        <div class="btn-group-vert">
                            <button @click="copyUrl(`chapter/${chapterId}?page=${currentPage?.ordinal ?? 1}`)">
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
                            <button :disabled="downloading" @click="downloadPage()">
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
                            <NuxtLink :to="`/chapter/${chapterId}/strip?page=${currentPage?.ordinal ?? 1}`">
                                <Icon>auto_fix</Icon>
                                <p>Create Strip</p>
                            </NuxtLink>
                            <button @click="goStart">
                                <Icon>restart_alt</Icon>
                                <p>Restart Chapter</p>
                            </button>
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
                                    {{ style.name }}
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
                                    {{ style.name }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Image Filter</label>
                            <SelectBox v-model="filter">
                                <option v-for="style in FILTER_STYLES" :value="style.value">
                                    {{ style.name }}
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
            </Tabs>
        </article>
        <div class="flex center margin-bottom">
            <NuxtLink :to="'/manga/' + manga?.id" class="flex center-items text-center">
                <Icon>menu_book</Icon>
                <p>Back to Manga</p>
            </NuxtLink>
        </div>

    </div>
</template>

<script setup lang="ts">
import {
    PAGE_STYLES,
    PROGRESS_BAR_STYLES,
    FilterStyle, FILTER_STYLES,
    ComicFormat
} from '~/models';
import type { ClassOptions } from '~/models';
const { fullscreen, serClasses } = useUtils();
const api = useMangaApi();
const { download } = useApiHelper();
const {
    manga, mangaExtended, cover,
    chapter, progress: stats,
    currentPage, goStart, goNext, goPrev,
    forceReset, bookmarkPage
} = useReaderHelper();
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

const id = computed(() => manga.value?.id);
const chapterId = computed(() => chapter.value?.id);
const chapterUrl = computed(() => api.promise.chapter.download(chapterId.value ?? '', ComicFormat.Zip));
const classes = computed(() => serClasses(props.class, { 'open': menuOpen.value }));

const isLink = (url: string) => url.toLowerCase().startsWith('http');

const resetPages = async () => {
    if (!id.value || !chapterId.value) return;

    pageLoading.value = true;
    await forceReset();
    pageLoading.value = false;
};

const toggleBookmark = async () => {
    if (!currentPage.value) return;
    bookmarking.value = true;
    await bookmarkPage();
    bookmarking.value = false;
}

const downloadData = async (url: string, name?: string) => {
    downloading.value = true;
    await download(url, name);
    downloading.value = false;
}

const downloadPage = async () => {
    if (!currentPage.value) return;

    downloading.value = true;
    if (!currentPage.value.fileName) {
        const meta = await api.promise.image.fetch(currentPage.value.id);
        const data = api.data(meta);
        if (!api.isSuccess(meta) || !data) {
            downloading.value = false;
            alert('Failed to download page: ' + api.errorMessage(meta));
            return;
        }

        currentPage.value.fileName = data.entity.fileName;
        currentPage.value.imageSize = data.entity.imageSize;
        currentPage.value.mimeType = data.entity.mimeType;
        currentPage.value.imageHeight = data.entity.imageHeight;
        currentPage.value.imageWidth = data.entity.imageWidth;
    }

    await downloadData(api.promise.image.downloadUrl(currentPage.value.id), currentPage.value.fileName ?? 'page.png');
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
