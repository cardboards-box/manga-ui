<template>
    <section class="new-home-hero">
        <div class="hero-bg">
            <Cover
                :image="cover"
                :manga="fullManga"
                type="background"
                width="100%"
                height="100%"
            />
        </div>
        <div class="hero-bg-overlay" />

        <div class="hero-inner">
            <div class="cover-shell">
                <Cover
                    :image="cover"
                    :manga="fullManga"
                    type="background"
                    width="100%"
                    height="100%"
                />
            </div>

            <div class="hero-copy">
                <div class="eyebrow">MangaBox</div>
                <h1
                    ref="titleElement"
                    :class="titleSizeClass"
                    :style="{ fontSize: titleFontSize }"
                >
                    {{ title }}
                </h1>
                <p class="alt-title" v-if="subtitle">{{ subtitle }}</p>

                <div class="meta-row">
                    <NuxtLink
                        v-for="tag in displayTags"
                        :key="tag.id"
                        class="pill"
                        :to="'/search/all?include=' + tag.id"
                        :title="tag.description"
                    >
                        {{ tag.name }}
                    </NuxtLink>
                    <span class="pill muted" v-if="extended?.uniqueChapterCount">
                        {{ extended.uniqueChapterCount }} chapters
                    </span>
                    <span class="pill warning" v-if="manga.nsfw">NSFW</span>
                </div>

                <div class="hero-actions">
                    <IconBtn
                        v-if="canRead && continueLink"
                        icon="play_arrow"
                        text="Continue"
                        color="primary"
                        :link="continueLink"
                    />
                    <IconBtn
                        icon="open_in_new"
                        text="Source"
                        color="shade"
                        :link="manga.url"
                        external
                    />
                    <IconBtn
                        v-if="canRead"
                        :icon="favourited ? 'heart_minus' : 'favorite'"
                        :fill="favourited"
                        :text="favourited ? 'Unfavourite' : 'Favourite'"
                        color="shade"
                        :loading="partialLoading"
                        @click="favourited = !favourited"
                    />
                </div>

                <div class="progress-card" v-if="canRead">
                    <div class="progress-card-top">
                        <div>
                            <span>Currently Reading</span>
                            <strong>{{ currentLabel }}</strong>
                        </div>
                        <IconBtn
                            v-if="continueLink"
                            icon="play_arrow"
                            title="Continue reading"
                            color="primary"
                            :link="continueLink"
                            inline
                        />
                    </div>
                    <div class="progress-track">
                        <div :style="{ width: progressPercent + '%' }" />
                    </div>
                    <div class="progress-footer">
                        <span>{{ progressFooter }}</span>
                        <span>{{ progressPercent.toFixed(0) }}%</span>
                    </div>
                    <p v-if="progress?.entity.lastReadAt">
                        Last read <Date :date="progress.entity.lastReadAt" utc format="r" />
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { MangaVolumes, MbImage, MbManga, MbMangaExt, MbRelatedPerson, MbTag, MbTypeManga } from '~/models';

const { canRead } = useAuthHelper();
const { chapterTitle } = useMangaUtils();
const {
    progress,
    progressData,
    favourited,
    partialLoading,
    chapters
} = useCurrentManga();

const props = defineProps<{
    manga: MbManga;
    fullManga: MbTypeManga;
    extended?: MbMangaExt;
    cover?: MbImage;
    tags: MbTag[];
    people: MbRelatedPerson[];
    volumes?: MangaVolumes;
}>();

const titleElement = ref<HTMLElement>();
const titleFontSize = ref<string>();
const title = computed(() => props.extended?.displayTitle ?? props.manga.title);
const titleSizeClass = computed(() => {
    const length = title.value.length;
    if (length > 95) return 'title-xxl';
    if (length > 70) return 'title-xl';
    if (length > 48) return 'title-lg';
    return 'title-md';
});
const subtitle = computed(() => props.extended?.displayTitle ? props.manga.title : props.manga.altTitles[0]);
const displayTags = computed(() => props.tags.slice(0, 4));
const currentChapter = computed(() => chapters.value.find(t => t.chapter.id === progress.value?.entity.lastReadChapterId));
const firstChapterId = computed(() => props.volumes?.volumes[0]?.chapters[0]?.whole[0]
    ?? props.volumes?.volumes[0]?.chapters[0]?.partial[0]?.versions[0]);
const continueChapterId = computed(() => progress.value?.entity.lastReadChapterId ?? firstChapterId.value);
const continueLink = computed(() => canRead.value && continueChapterId.value ? `/chapter/${continueChapterId.value}` : undefined);
const progressPercent = computed(() => progress.value?.entity.progressPercentage ?? progressData.value.total ?? 0);
const currentLabel = computed(() => currentChapter.value ? chapterTitle(currentChapter.value.chapter) : 'Start from the first chapter');
const progressFooter = computed(() => progressData.value.totalSlug || `${progressPercent.value.toFixed(0)}% complete`);

const maxTitleFontSize = () => {
    const width = window.innerWidth;
    if (width <= 650) return Math.min(Math.max(width * .1, 28.8), 48);
    return Math.min(Math.max(width * .05, 32), 76.8);
};

const fitTitle = () => {
    if (!import.meta.client) return;

    nextTick(() => requestAnimationFrame(() => {
        const element = titleElement.value;
        if (!element) return;

        const max = maxTitleFontSize();
        let low = 14;
        let high = max;
        let best = low;

        for (let i = 0; i < 10; i++) {
            const mid = (low + high) / 2;
            element.style.fontSize = `${mid}px`;

            const lineHeight = mid;
            const maxHeight = Math.ceil(lineHeight * 2) + 1;
            if (element.scrollHeight <= maxHeight) {
                best = mid;
                low = mid;
            } else {
                high = mid;
            }
        }

        titleFontSize.value = `${Math.floor(best * 100) / 100}px`;
    }));
};

watch(title, () => fitTitle());

onMounted(() => {
    fitTitle();
    window.addEventListener('resize', fitTitle);
    setTimeout(fitTitle, 100);
});

onUnmounted(() => {
    window.removeEventListener('resize', fitTitle);
});
</script>

<style scoped lang="scss">
.new-home-hero {
    position: relative;
    overflow: hidden;
    min-height: 430px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .hero-bg,
    .hero-bg-overlay {
        position: absolute;
        inset: 0;
    }

    .hero-bg {
        opacity: .5;
        filter: blur(22px) brightness(.32) saturate(.75);
        transform: scale(1.12);
    }

    .hero-bg-overlay {
        background:
            linear-gradient(90deg, rgba(12, 9, 12, .96), rgba(12, 9, 12, .66) 52%, rgba(12, 9, 12, .18)),
            linear-gradient(0deg, var(--bg-color), transparent 42%);
    }

    .hero-inner {
        position: relative;
        z-index: 1;
        display: flex;
        gap: 2rem;
        width: min(1180px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 3rem 0 2rem;
        align-items: flex-start;
    }

    .cover-shell {
        width: clamp(150px, 18vw, 230px);
        aspect-ratio: 2 / 3;
        flex: 0 0 auto;
        overflow: hidden;
        border-radius: 8px;
        background: var(--bg-color-accent-dark);
        box-shadow: 0 22px 65px rgba(0, 0, 0, .65), 0 0 0 1px rgba(255, 255, 255, .1);
    }

    .hero-copy {
        max-width: 760px;
        min-width: 0;
    }

    .eyebrow,
    .progress-card span {
        color: var(--color-muted-light);
        font-size: .72rem;
        text-transform: uppercase;
        letter-spacing: 0;
    }

    h1 {
        display: block;
        margin: .35rem 0 0;
        line-height: 1;
        overflow-wrap: anywhere;

        &.title-md {
            font-size: clamp(2rem, 5vw, 4.8rem);
        }

        &.title-lg {
            font-size: clamp(1.85rem, 4.15vw, 3.7rem);
        }

        &.title-xl {
            font-size: clamp(1.7rem, 3.35vw, 2.85rem);
        }

        &.title-xxl {
            font-size: clamp(1.55rem, 2.75vw, 2.25rem);
        }
    }

    .alt-title {
        margin-top: .5rem;
        color: var(--color-muted-light);
    }

    .meta-row,
    .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: .5rem;
        margin-top: 1rem;
    }

    .pill {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: .25rem .65rem;
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: var(--brd-radius);
        background: rgba(255, 255, 255, .05);
        color: var(--color);
        font-size: .78rem;
        text-decoration: none;

        &.muted { color: var(--color-muted-light); }
        &.warning {
            border-color: var(--color-warning);
            color: var(--color-warning);
        }
    }

    .progress-card {
        width: min(440px, 100%);
        max-width: 100%;
        box-sizing: border-box;
        margin-top: 1.25rem;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, .1);
        border-radius: 8px;
        background: rgba(255, 255, 255, .045);
    }

    .progress-card-top,
    .progress-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .progress-card-top > div {
        min-width: 0;
    }

    .progress-card strong {
        display: block;
        margin-top: .2rem;
        font-size: .95rem;
        overflow-wrap: anywhere;
    }

    .progress-track {
        height: 7px;
        margin-top: .8rem;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, .1);

        div {
            height: 100%;
            border-radius: inherit;
            background: var(--color-primary);
        }
    }

    .progress-footer {
        margin-top: .4rem;
        font-size: .75rem;
    }

    .progress-card p {
        margin-top: .45rem;
        color: var(--color-muted-light);
        font-size: .75rem;
    }
}

@media only screen and (max-width: 650px) {
    .new-home-hero {
        .hero-inner {
            flex-flow: column;
            align-items: stretch;
            padding-top: 1.5rem;
        }

        .cover-shell {
            align-self: center;
            width: min(170px, 48vw);
        }

        .hero-copy {
            width: 100%;
            max-width: 100%;
        }

        h1.title-md,
        h1.title-lg,
        h1.title-xl,
        h1.title-xxl {
            font-size: clamp(1.8rem, 10vw, 3rem);
        }

        .progress-card-top,
        .progress-footer {
            gap: .65rem;
        }
    }
}
</style>
