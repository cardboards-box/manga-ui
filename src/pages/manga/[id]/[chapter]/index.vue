<template>
<Error v-if="error" :message="error?.message" />
<div v-else 
    class="page-wrapper flex fill-parent" 
    :class="{ 'open': navOpen, 'over': pageMenuOver }"
>
    <main 
        class="fill flex"
        v-swipe
        @tap="pageClick"
        @swipe-left="forward"
        @swipe-right="backward"
        ref="clickarea" 
        :class="pageStyle" 
        v-if="!external"
    >
        <Loading v-if="pending" />
        <template 
            v-else-if="pageStyle === PageStyle.SinglePageFit"
        >
            <div 
                class="image" 
                :style="{ 
                    'background-image': `url(${pageUrl})`, 
                    'filter': imageFilter 
                }" 
            />
            <img class="hidden" v-if="nextPageImage" :src="nextPageImage" />
        </template>

        <template v-else-if="pageStyle === PageStyle.LongStrip">
            <img 
                v-for="image of pageUrls" 
                :src="image" 
                :style="{ 'filter': imageFilter }" 
            />
        </template>

        <template v-else-if="pageStyle === PageStyle.DoublePage">
            <div 
                class="image" 
                :style="{ 
                    'background-image': `url(${pageUrl})`, 
                    'filter': imageFilter
                }" 
            />
            <div 
                class="image" 
                v-if="nextPageImage" 
                :style="{ 
                    'background-image': `url(${nextPageImage})`, 
                    'filter': imageFilter
                }" 
            />
        </template>

        <template v-else>
            <img :src="pageUrl" :style="{ 'filter': imageFilter }" />
            <img class="hidden" v-if="nextPageImage" :src="nextPageImage" />
        </template>

        <div class="progress-bar" :class="progressBar">
            <NuxtLink 
                v-for="(_, i) of pageUrls" 
                :to="genLink('Page', i + 1)"
                :class="{ 'active': i < page }"
                class="progress"
            />
        </div>

        <ClientOnly>
        <div class="tutorial" v-if="showTutorial">
            <div 
                class="region flex"
                v-for="reg in regions"
                :class="reg.name"
                :style="{ 
                    'top': reg.y + '%', 
                    'left': reg.x + '%',
                    'width': reg.width + '%',
                    'height': reg.height + '%'
                }"
            >
                <div 
                    class="center flex row pad margin" 
                    v-if="reg.name === 'center'"
                >
                    <h2 class="pad">Tutorial:</h2>
                    <p class="pad">
                        Click here (in the center) to open the side bar!
                    </p>
                    <button 
                        class="icon-btn pad-left" 
                        @click="() => showTutorial = false"
                    >
                        <Icon>close</Icon>
                        <p>Close Tutorial</p>
                    </button>
                </div>
                <div 
                    class="center pad rounded bg-accent" 
                    v-else-if="reg.name === 'left'"
                >
                    <p class="shadow">
                        Click anywhere here (on the red) to go back a page!
                    </p>
                </div>
                <div 
                    class="center pad rounded bg-accent" 
                    v-else-if="reg.name === 'right'"
                >
                    <p class="shadow">
                        Click anywhere here (on the green) to go to the next page!
                    </p>
                </div>
            </div>
        </div>
        </ClientOnly>
    </main>
    <main class="fill flex external" v-else>
        <div class="center">
            This is an external manga! Click&nbsp;
            <a :href="external" target="_blank">here</a>&nbsp;
            to read it.
        </div>
    </main>
    <div class="fade" @click="() => menuOpen = !menuOpen" />
    <aside class="flex row">
        <div class="floating-image"  />
        <header class="flex center-items">
            <button @click="() => menuOpen = !menuOpen">
                <Icon>close</Icon>
            </button>
            <NuxtLink :to="'/manga/' + id" class="flex fill center-items text-center">
                {{ manga?.title }}
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
                            {{ (((chapterIndex + 1) / chapters.length) * 100).toFixed(2) }}%
                        </p>
                        <p v-if="!external">
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

                        <div class="control no-top">
                            <SelectBox v-model="chapterId">
                                <option 
                                    v-for="chap in chapters" 
                                    :value="chap.id"
                                >
                                    Ch. {{ chap.ordinal }} - {{ chap.title }}
                                </option>
                            </SelectBox>
                        </div>
                        <div 
                            class="control no-top" 
                            v-if="pageStyle !== PageStyle.LongStrip && !external"
                        >
                            <SelectBox v-model="page">
                                <option 
                                    v-for="(_, index) in chapter?.pages" 
                                    :value="index + 1"
                                >
                                    Page: #{{ index + 1 }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="btn-group">
                            <NuxtLink 
                                :class="{ 'disabled': !hasPreviousChapter }" 
                                :to="genLink('PrevChapter')"
                            >
                                <Icon>skip_previous</Icon>
                            </NuxtLink>
                            <NuxtLink 
                                :class="{ 'disabled': !hasPreviousPage }" 
                                :to="genLink('PrevPage')" 
                                v-if="pageStyle !== PageStyle.LongStrip"
                            >
                                <Icon>navigate_before</Icon>
                            </NuxtLink>
                            <NuxtLink :to="genLink('ChapterStart')">
                                <Icon>restart_alt</Icon>
                            </NuxtLink>
                            <NuxtLink 
                                :class="{ 'disabled': !hasNextPage }" 
                                :to="genLink('NextPage')" 
                                v-if="pageStyle !== PageStyle.LongStrip"
                            >
                                <Icon>navigate_next</Icon>
                            </NuxtLink>
                            <NuxtLink 
                                :class="{ 'disabled': !hasNextChapter }" 
                                :to="genLink('NextChapter')"
                            >
                                <Icon>skip_next</Icon>
                            </NuxtLink>
                        </div>
                        <div class="btn-group-vert">
                            <button 
                                @click="copyUrl(`manga/${id}/${chapterId}?page=${page}`)"
                            >
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
                            <button 
                                :disabled="downloading" 
                                @click="downloadData(pageUrl)"
                            >
                                <Icon :spin="downloading">
                                    {{ !downloading ? 'download' : 'sync' }}
                                </Icon>
                                <p>Download Page</p>
                            </button>
                            <button 
                                :disabled="downloading" 
                                @click="downloadData(chapterUrl)"
                            >
                                <Icon :spin="downloading">
                                    {{ !downloading ? 'download_for_offline' : 'sync' }}
                                </Icon>
                                <p>Download Chapter</p>
                            </button>
                            <NuxtLink 
                                :to="`/manga/${id}/${chapterId}/strip?page=${page}`"
                            >
                                <Icon>auto_fix</Icon>
                                <p>Create Strip</p>
                            </NuxtLink>
                            <NuxtLink :to="genLink('ChapterStart')">
                                <Icon>restart_alt</Icon>
                                <p>Restart Chapter</p>
                            </NuxtLink>
                            <button 
                                :disabled="bookmarking" 
                                @click="toggleBookmark"
                            >
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
                                    :value="style"
                                >
                                    {{ style }}
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
                                <option v-for="style in PAGE_STYLES" :value="style">
                                    {{ style }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Image Filter</label>
                            <SelectBox v-model="filter">
                                <option v-for="style in FILTER_STYLES" :value="style">
                                    {{ style }}
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
                            <input type="range" min="1" max="100" v-model="brightness" />
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
                <Tab 
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
                </Tab>
            </Tabs>
        </article>
    </aside>
</div>
</template>

<script setup lang="ts">
import { 
    PageStyle, PAGE_STYLES, 
    PROGRESS_BAR_STYLES, 
    FilterStyle, FILTER_STYLES, 
    Bookmark
} from '~/models';

definePageMeta({
    pageTransition: false,
    layoutTransition: false,
    layout: 'nohead'
});

type LinkTypes = 'NextChapter' | 'PrevChapter' | 
    'NextPage' | 'PrevPage' | 
    'ChapterStart' | 'Page';
interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    name: 'left' | 'right' | 'top' | 'bottom' | 'center';
}
    
const DEFAULT_IMAGE = '/broken.png';

const { proxy, download, throttle } = useApiHelper();
const { pages, fetch, progress, resetPages: reset, bookmark } = useMangaApi();
const route = useRoute();
const { 
        invertControls, forwardOnly, 
    brightness, pageStyle, filterStyle: filter, 
    customFilter, progressBarStyle: progressBar,
    scrollAmount, showTutorial,
    pageMenuOver, regionMargin
} = useAppSettings();

const {
    token,
    apiUrl,
    menuOpen
} = useSettingsHelper();

const downloading = ref(false);

const navOpen = computed({
    get: () => {
        if (!process.client) return false;
        return menuOpen.value;
    },
    set: (value: boolean) => menuOpen.value = value
});

const page = computed({
    get: () => +(route.query.page?.toString() || '1'),
    set: (value: number) => genLinkVal(value)
});

const chapterId = computed({
    get: () => +(route.params.chapter?.toString() || '0'),
    set: (value: number) => genLinkVal(1, value)
});

const bookmarking = ref(false);
const pageLoading = ref(false);
const id = computed(() => route.params.id.toString());
let wasUnauthed = !process.client && !token.value;
const { data, pending, error, refresh: refreshManga } = await fetch(id.value);

const manga = computed(() => data.value?.manga);
const chapters = computed(() => data.value?.chapters || []);
const chapter = computed(() => chapters.value.find(t => t.id === chapterId.value));
const pageUrls = computed(() => 
    !manga.value || 
    !chapter.value 
        ? [] 
        : chapter.value.pages
            .map(t => proxy(t, 'manga-page', manga.value?.referer)));
const pageUrl = computed(() => pageUrls.value[page.value - 1] || DEFAULT_IMAGE);
const title = computed(() => `${manga.value?.title} | Ch. ${chapter.value?.ordinal}`);
const bookmarks = computed(() => data.value?.bookmarks || []);
const nextPageImage = computed(() => pageUrls.value[page.value] || DEFAULT_IMAGE);

const chapterUrl = computed(() => `${apiUrl}/manga/${id.value}/${chapterId.value}/download`);
const description = computed(() => manga.value?.description ?? title.value);
const external = computed(() => chapter.value?.externalUrl);

const chapterIndex = computed(() => (!manga.value || !chapter.value) ? -1 : chapters.value.findIndex(a => a.id === chapter.value?.id));
const hasNextChapter = computed(() => manga.value && chapter.value && !!chapters.value[chapterIndex.value + 1]);
const hasNextPage = computed(() => manga.value && chapter.value && !!chapter.value.pages[page.value] || hasNextChapter.value);
const hasPreviousChapter = computed(() => manga.value && chapter.value && !!chapters.value[chapterIndex.value - 1]);
const hasPreviousPage = computed(() => manga.value && chapter.value && !!chapter.value.pages[page.value - 2] || hasPreviousChapter.value);
const hasNextPageAbsolute = computed(() => manga.value && chapter.value && !!chapter.value.pages[page.value]);
const hasPrevPageAbsolute = computed(() => manga.value && chapter.value && !!chapter.value.pages[page.value - 2]);

const imageFilter = computed(() => {
    let filters: { [key: string]: string } = {
        'brightness': brightness.value + '%'
    };

    switch(filter.value) {
        case FilterStyle.Invert: filters['invert'] = '100%'; break;
        case FilterStyle.BlueLight:
            filters['sepia'] = '40%';
            filters['saturate'] = '200%';
            break;
        case FilterStyle.BluePrint:
            filters['sepia'] = '100%';
            filters['saturate'] = '500%';
            filters['hue-rotate'] = '180deg';
            break;
        case FilterStyle.Custom:
            if (customFilter.value) return customFilter.value;
            break;
    }

    return Object.keys(filters)
        .map(key => `${key}(${filters[key]})`)
        .join(' ');
});

const regions = computed(() => {
    const margin = regionMargin.value;
    const w = (100 / 2) - (margin / 2);
    const regions: Rect[] = [
        { x: 0, y: 0, width: 100, height: w, name: 'top' },
        { x: 0, y: 100 - w, width: 100, height: w, name: 'bottom' },
        { x: 0, y: 0, width: w, height: 100, name: 'left' },
        { x: 100 - w, y: 0, width: w, height: 100, name: 'right' },
        { x: w, y: w, width: 100 - (w * 2), height: 100 - (w * 2), name: 'center' }
    ];

    return regions;
});

const inRegion = (rect: DOMRect, mx: number, my: number) => {
    const output: ('top' | 'left' | 'bottom' | 'right' | 'center')[] = [];
    const x = (mx - rect.left) / rect.width * 100;
    const y = (my - rect.top) / rect.height * 100;

    for(let reg of regions.value) {
        if (x >= reg.x && x <= reg.x + reg.width &&
            y >= reg.y && y <= reg.y + reg.height)
            output.push(reg.name);
    }

    return output;
};

const mouseInRegion = (x: number, y: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    return inRegion(rect, x, y);
};

const fetchManga = async (force: boolean) => {
    if (!id.value || !force) return;

    await refreshManga();
}

const doFetch = async (force: boolean) => {
    await fetchManga(force);

    if (!data.value || !manga.value || !chapter.value || external.value) return;

    if (chapter.value.pages.length === 0) {
        pageLoading.value = true;
        const { data: outputPages } = await pages(id.value, chapterId.value);
        chapter.value.pages = [...outputPages.value || []];
        pageLoading.value = false;
    }

    if (chapter.value.pages.length === 0) return;

    if (page.value > chapter.value.pages.length) {
        navigateTo(`/manga/${id.value}/${chapterId.value}?page=${chapter.value.pages.length}`);
        return;
    } 

    if (page.value <= 0) {
        navigateTo(`/manga/${id.value}/${chapterId.value}?page=1`);
        return;
    }

    if (process.client && token.value) {
        progress(manga.value.id, chapterId.value, page.value - 1);
    }

    clickarea.value?.scroll({ top: 0, behavior: 'smooth' });
}

const resetPages = async () => {
    pageLoading.value = true;
    await reset(id.value, chapterId.value);
    await doFetch(true);
    pageLoading.value = false;
};

const toggleBookmark = async () => {
    if (!chapter.value) return;
    bookmarking.value = true;

    const pages = bookmarks.value
        .find(t => t.mangaChapterId === chapter.value?.id)?.pages || [];

    const i = pages.indexOf(page.value);
    if (i === -1) {
        pages.push(page.value);
    } else {
        pages.splice(i, 1);
    }

    await bookmark(id.value, chapter.value.id, pages);
    await doFetch(true);

    bookmarking.value = false;
}

const clickarea = ref<HTMLElement | undefined>();

useHead({ title });
useServerSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage: computed(() => pageUrls.value[page.value - 1] ?? manga.value?.cover ?? DEFAULT_IMAGE),
    twitterCard: 'summary_large_image'
});

const forward = () => {
    const link = genLink(invertControls.value ? 'PrevPage': 'NextPage');
    if (link) navTo(link);
}

const backward = () => {
    const link = genLink(invertControls.value ? 'NextPage': 'PrevPage');
    if (link) navTo(link);
}

const pageClick = (event: MouseEvent) => {
    if (!clickarea.value) return;

    const output = mouseInRegion(event.clientX, event.clientY, clickarea.value);

    if(output.includes('center')) {
        menuOpen.value = !menuOpen.value;
        return;
    }

    if (forwardOnly.value) {
        const link = genLink('NextPage');
        if (link) navTo(link);
        return;
    }

    let isBack = output.includes('left') || (output.includes('top') && !output.includes('right'));
    let isForward = output.includes('right') || (output.includes('bottom') && !output.includes('left'));

    if (isBack) {
        backward();
        return;
    }

    if (isForward) {
        forward();
        return;
    }
};

function genLink(type: LinkTypes, p?: number, c?: number): string | undefined {
    const chapter = c || chapterId.value;
    const pageNum = p || page.value;

    switch(type) {
        case 'ChapterStart': return `/manga/${id.value}/${chapter}?page=1`;
        case 'NextChapter':
            if (!hasNextChapter.value) return undefined;
            return `/manga/${id.value}/${chapters.value[chapterIndex.value + 1].id}?page=1`;
        case 'PrevChapter':
            if (!hasPreviousChapter.value) return undefined;
            return `/manga/${id.value}/${chapters.value[chapterIndex.value - 1].id}?page=9999`;
        case 'NextPage':
            if (!hasNextPage.value) return undefined;
            if (!hasNextPageAbsolute.value) return genLink('NextChapter');
            return `/manga/${id.value}/${chapter}?page=${pageNum + 1}`;
        case 'PrevPage':
            if (!hasPreviousPage.value) return undefined;
            if (!hasPrevPageAbsolute.value) return genLink('PrevChapter');
            return `/manga/${id.value}/${chapter}?page=${pageNum - 1}`;
        case 'Page': return `/manga/${id.value}/${chapter}?page=${pageNum}`;
    }
}

function genLinkVal(p: number | Event, c?: number | Event) {
    const chapter = !c ? chapterId.value : (typeof c === 'number' ? c : +(<any>c.target)!.value);
    const page = typeof p === 'number' ? p : +(<any>p.target)!.value;

    const link = genLink('Page', page, chapter);
    if (!link) return;
    navTo(link);
}

const navTo = (link: string) => navigateTo(link);

const copyUrl = (url: string) => {
    navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/${url}`);
}

const bookmarkChapter = (mark: Bookmark) => 
    chapters.value.find(t => t.id === mark.mangaChapterId);

const bookmarkImage = (mark: Bookmark, page: number) => {
    const chapter = bookmarkChapter(mark);
    if (!chapter) return DEFAULT_IMAGE;

    const url = chapter.pages[page - 1];
    return url ? proxy(url, 'manga-page', manga.value?.referer) : DEFAULT_IMAGE;
};

const downloadData = async (url: string, name?: string) => {
    downloading.value = true;
    await download(url, name);
    downloading.value = false;
}

const isLink = (url: string) => url.toLowerCase().startsWith('http');

const fullscreen = () => {
    const elem = <any>document.documentElement;
    const doc = <any>document;

    const isFullScreen = ((<any>window).fullScreen) || (
            window.innerWidth == screen.width && 
            window.innerHeight == screen.height
        ) || (
            !window.screenTop && 
            !window.screenY
        );

    if (isFullScreen) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) { /* Safari */
            doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) { /* IE11 */
            doc.msExitFullscreen();
        }
        return;
    }

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

const scroll = (up: boolean) => {
    clickarea.value?.scrollBy({
        top: (up ? -scrollAmount.value : scrollAmount.value),
        behavior: 'smooth'
    });
}

const scrollThrottle = computed(() => scrollAmount.value);
const scrollDown = computed(() => throttle<void>(() => scroll(false), scrollThrottle.value));
const scrollUp = computed(() => throttle<void>(() => scroll(true), scrollThrottle.value));

const arrowKeyHandler = (ev: KeyboardEvent, down: boolean) => {
    const scrollabled = [
        PageStyle.LongStrip, 
        PageStyle.SinglePageFitToWidth, 
        PageStyle.SinglePageNaturalSize
    ].indexOf(pageStyle.value) !== -1;
    
    switch(ev.key) {
        case 'ArrowLeft': if(!down) backward(); return;
        case 'ArrowRight': if(!down) forward();  return;
        case 'ArrowUp':
            if (!scrollabled) { 
                backward(); 
                return;
            }

            scrollUp.value();
            return;

        case 'ArrowDown':
            if (!scrollabled) { 
                forward(); 
                return;
            }

            scrollDown.value();
            return;
    }
};
const arrowKeyDown = (ev: KeyboardEvent) => arrowKeyHandler(ev, true);
const arrowKeyUp = (ev: KeyboardEvent) => arrowKeyHandler(ev, false);

onMounted(() => nextTick(() =>  {
    window.addEventListener('keyup', arrowKeyUp);
    window.addEventListener('keydown', arrowKeyDown);

    navOpen.value = menuOpen.value;
    if (!token.value && !!chapter.value?.pages.length) return;

    //Refetch with authentication context
    doFetch(wasUnauthed);
    wasUnauthed = false;
}));

onUnmounted(() => {
    window.removeEventListener('keyup', arrowKeyUp);
    window.removeEventListener('keydown', arrowKeyDown);
})

watch(() => route.query, () => doFetch(false));
</script>

<style lang="scss" scoped>
$navwidth: 400px;
$progress-height: 10px;

@mixin page-menu-over {
    aside {
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

    main { max-width: 100% !important; }

    .fade {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color-accent-dark);
        z-index: -1;
        opacity: 0;
        transition: all 250ms;
    }

    &.open {

        .fade {
            z-index: 1;
            opacity: 1;
        }
    }
}

.page-wrapper {
    position: relative;

    main {
        position: relative;
        overflow: auto;
        max-width: 100%;
        transition: all 150ms;

        img { max-width: 100%; }

        .image {
            flex: 1;
            background-position: center;
            background-size: contain;
            background-repeat: no-repeat;
        }

        &.single-page {
            img {
                margin: 0 auto;

                &.hidden { display: none; }
            }
        }

        &.long-strip { flex-flow: column; }

        &.fit-to-width {
            img {
                width: 100%;
                max-width: 100%;
                max-height: unset;
                margin: auto;
            }
        }

        &.fit-to-height {
            img {
                margin: auto;
                max-width: unset;
                max-height: 100%;
                height: 100%;
            }
        }

        &.natural-size {
            img {
                margin: auto;
                max-width: unset;

                &.hidden {
                    position: absolute;
                    left: -100%;
                }
            }
        }

        .progress-bar {
            position: fixed;
            display: flex;
            flex-flow: row;

            .progress {
                flex: 1;
                background-color: var(--bg-color-accent);
                transition: all 250ms;
                cursor: pointer;

                &.active { background-color: var(--color-primary-trans); }
            }

            &.bottom {
                width: 100%;
                height: $progress-height;
                bottom: 0;
                left: 0;

                .progress {
                    height: 100%;
                }

                &:hover {
                    height: #{$progress-height * 2};
                }
            }

            &.left, &.right {
                top: 0;
                height: 100%;
                flex-flow: column;
                width: $progress-height;

                .progress {
                    width: 100%;
                    height: 100%;
                }

                &:hover {
                    width: #{$progress-height * 2};
                }
            }

            &.left {
                left: 0;
            }

            &.right {
                right: 0;
            }
        }

        &.external {
            a { text-decoration: underline; }
        }

        .tutorial {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            max-width: var(--full-width);
            max-height: var(--full-height);

            .region {
                position: absolute;

                &.left {
                    background-color: #70190a8f;
                }

                &.right {
                    background-color: #4f960e8f;
                }

                &.center {
                    background-color: var(--bg-color-accent-dark);
                }
            }
        }
    }
    aside {
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
    }
    &.open {
        aside { margin-right: 0; }
        main { max-width: calc(100vw - #{$navwidth}); }
    }
    &.over { @include page-menu-over();  }
}

@media only screen and (max-width: 600px) {
    .page-wrapper { @include page-menu-over(); }
}
</style>