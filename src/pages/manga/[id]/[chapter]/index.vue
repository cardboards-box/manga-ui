<template>
    <div
        class="page-wrapper flex fill-parent"
        :class="{ 'open': menuOpen, 'over': pageMenuOver }"
    >
        <Reader
            v-model="menuOpen"
            :class="{ 'over': pageMenuOver }"
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

const DEFAULT_IMAGE = '/broken.png';
const route = useRoute();
const { currentUser } = useAuthApi();
const { menuOpen } = useSettingsHelper();
const { fetch, loading } = useReaderHelper();
const { pageMenuOver } = useAppSettings();
const { data, refresh, pending } = await useLazyAsyncData(async () => await fetch());
const isLoading = computed(() => loading.value || pending.value);
const output = computed(() => data.value?.output);
const title = computed(() => `${output.value?.manga.title} | Ch. ${output.value?.version.ordinal}`);
const description = computed(() => output.value?.manga.description ?? title.value);

useHead({ title });
useServerSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage: computed(() => output.value?.page ?? output.value?.manga.cover ?? DEFAULT_IMAGE),
    twitterCard: 'summary_large_image'
});

onMounted(() => {
    watch(() => route.query, () => refresh(), { deep: true });
    watch(() => route.params, () => refresh(), { deep: true });
    watch(() => currentUser.value, () => refresh(), { deep: true });
});

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

    &.over { @include page-menu-over(); }
}

@media only screen and (max-width: 600px) {
    .page-wrapper {
        @include page-menu-over();
    }
}
</style>
