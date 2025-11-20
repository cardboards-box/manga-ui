<template>
    <CardList
        title="Reverse Image Lookup"
        :search="combined"
        :pending="pending"
        :noresults="!!results"
        @headerstuck="(v) => stuck = v"
        @back="() => results = undefined"
        v-if="results !== undefined || pending"
    >
        <ReverseSearch
            v-model="search"
            @file="searchFile"
            :stuck="stuck"
        />
    </CardList>
    <div
        v-else
        class="flex row center search-box"
        :class="{ active }"
        @dragenter.prevent="active = true"
        @dragover.prevent="active = true"
        @dragleave.prevent="active = false"
        @drop.prevent="dragFile"
    >
        <h2 class="center-horz margin-top margin-bottom">Reverse Manga Search</h2>
        <div class="flex row fill">
            <div class="center flex">
                <Image src="/kitsu.gif" width="100px" />
                <h3 class="center-vert">
                    Drag an image here or
                    <a class="file-click" @click="clickFile">upload a file</a>
                </h3>
            </div>
        </div>
        <div class="flex">
            <div class="spacer fill center-vert margin-left margin-right" />
            <div class="or">OR</div>
            <div class="spacer fill center-vert margin-left margin-right" />
        </div>
        <div class="flex margin">
            <InputGroup
                v-model="search"
                placeholder="Paste an image URL"
                class="fill"
                @search="searchUrl(search)"
            />
        </div>

        <input
            class="file-input"
            type="file"
            ref="fileInput"
            @change="initialSearch"
        />
    </div>
</template>

<script setup lang="ts">
import type { ImageSearch } from '~/models';

const route = useRoute();

const url = computed(() => route.query.url?.toString() ?? '');

const { reverseFile, reverseUrl, proxy } = useMangaApi();
const { toPromise } = useApiHelper();
const search = ref('');
const active = ref(false);
const pending = ref(false);
const stuck = ref(false);
const fileInput = ref<HTMLInputElement>();
const results = ref<ImageSearch | undefined>();
const combined = computed(() =>
    results.value
        ? [
            ...results.value.match,
            ...results.value.vision,
            ...results.value.textual
        ] : []);

const first = computed(() => combined.value[0]);

const title = computed(() => first.value?.manga?.title ?? 'Reverse Image Search');
const description = computed(() =>
    first.value?.manga.description
    ?? 'Reverse Image search Manga pages to find the manga source.');
const cover = computed(() =>
    first.value?.manga.cover
        ? proxy(first.value.manga.cover, 'manga-cover')
        : '/logo.png');

const clickFile = () => {
    if (!fileInput.value) return;

    fileInput.value.click();
}

const dragFile = (event: DragEvent) => {
    active.value = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;

    searchFile(file);
}

const initialSearch = (event: Event) => {
    if (!event?.target) return;

    const files: File[] = (<any>event.target).files;
    if (!files || files.length <= 0) return;

    const file = files[0];
    searchFile(file);
}

const searchFile = async (file: File) => {
    pending.value = true;
    results.value = undefined;
    results.value = await toPromise(reverseFile(file), true) ?? undefined;
    pending.value = false;
};

const searchUrl = async (url: string) => {
    if (!url) return;

    pending.value = true;
    results.value = undefined;
    results.value = await toPromise(reverseUrl(url, true)) ?? undefined;
    pending.value = false;
}

const onPaste = (event: ClipboardEvent) => {
    const items : DataTransferItemList = (event.clipboardData || (<any>event).originalEvent.clipboardData).items;
    if (!items) return;

    for(const index in items) {
        const item = items[index];
        if (item.kind !== 'file') continue;

        const file = item.getAsFile();
        if (!file) continue;

        searchFile(file);
        return;
    }
}

useHead({ title });

useServerSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage: cover,
    twitterCard: 'summary_large_image'
});

onMounted(() => {
    nextTick(() => {
        searchUrl(url.value);
    });

    document.onpaste = onPaste;
});

onUnmounted(() => {
    document.onpaste = null;
});

watch(() => url.value, () => searchUrl(url.value));
</script>

<style scoped lang="scss">

.search-box {
    border: 1px solid var(--color-primary);
    border-radius: var(--margin);
    min-width: min(98vw, 1050px);
    min-height: min(98vh, 400px);

    &.active {
        background-color: var(--bg-color-accent);
    }

    .spacer {
        border-top: 1px solid var(--color-primary);
    }

    .file-input {
        display: none;
    }

    .file-click {
        color: var(--color-primary);
    }
}
</style>
