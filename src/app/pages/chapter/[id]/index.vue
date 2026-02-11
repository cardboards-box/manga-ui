<template>
    <Error
        v-if="!canRead"
        message="This page does not exist!"
        show-reset
        reset-text="Go Back!"
        @reset="goBack"
    />
    <div
        v-else
        class="page-wrapper flex fill-parent"
        :class="{ 'open': menuOpen, 'over': pageMenuOver }"
    >
        <Reader
            v-model="menuOpen"
            :class="{ 'over': pageMenuOver, 'reader': true, 'open': menuOpen }"
            :loading="isLoading"
        />
        <div class="fade" @click="() => menuOpen = !menuOpen" />
        <ReaderSettings
            v-model="menuOpen"
            :class="{ 'over': pageMenuOver }"
            :loading="isLoading"
        />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    pageTransition: false,
    layoutTransition: false,
    layout: 'nohead'
});

const route = useRoute();
const { canRead } = useAuthHelper();
const { menuOpen } = useSettingsHelper();
const { pageMenuOver } = useAppSettings();
const { chapterTitle } = useMangaUtils();
const { fetch, manga, mangaExtended, chapter, pending } = useReaderHelper();

const { pending: apiLoading } = useAsyncData(
    `chapter-${route.params.id}-fetch`,
    async () => await fetch(), {
    watch: [() => route.params, () => route.query, () => canRead.value],
});

const isLoading = computed(() => pending.value || apiLoading.value);
const title = computed(() => {
    const chapTitle = chapter.value ? chapterTitle(chapter.value) : 'Chapter Not Found!';
    const mangTitle = mangaExtended.value?.displayTitle ?? manga.value?.title ?? 'Manga Not Found!';
    return `${chapTitle} - ${mangTitle}`;
});

useHead({ title });

const goBack = () => {
    history.back();
};
</script>

<style scoped lang="scss">
@mixin page-menu-over {
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

    .reader {
        max-width: 100vw;

        &.open {
            max-width: calc(100vw - 400px);
        }
    }

    &.over { @include page-menu-over(); }
}

@media only screen and (max-width: 600px) {
    .page-wrapper {
        @include page-menu-over();
    }
}
</style>
