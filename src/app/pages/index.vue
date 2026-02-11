<template>
    <Error v-if="error" :message="error" show-reset @reset="() => error = undefined" />
    <CardList
        title="Reverse Image Lookup"
        :manga="results"
        :pending="pending"
        :noresults="!!results && results.length === 0"
        :content-ratings="contentRatings"
        @headerstuck="(v) => stuck = v"
        @back="() => results = []"
        v-else-if="results.length > 0 || pending"
    >
        <ReverseSearch
            v-model="search"
            @file="doSearch"
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
                @search="doSearch(search)"
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
import type { ImageSearchResultType } from '~/models';
const route = useRoute();
const cache = useCacheHelper();

const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);

const url = computed(() => route.query.url?.toString() ?? '');

const api = useMangaApi();
const search = ref('');
const active = ref(false);
const pending = ref(false);
const stuck = ref(false);
const fileInput = ref<HTMLInputElement>();
const results = ref<ImageSearchResultType[]>([]);
const error = ref<string>();

const clickFile = () => {
    if (!fileInput.value) return;

    fileInput.value.click();
}

const dragFile = (event: DragEvent) => {
    active.value = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;

    doSearch(file);
}

const initialSearch = (event: Event) => {
    if (!event?.target) return;

    const files: File[] = (<any>event.target).files;
    if (!files || files.length <= 0) return;

    const file = files[0]!;
    doSearch(file);
}

const doSearch = async (file: File | string) => {
    if (!file) return;

    pending.value = true;
    results.value = [];
    const output = await (typeof file === 'string'
        ? api.promise.reverse.url(file)
        : api.promise.reverse.file(file));
    results.value = api.data(output) ?? [];
    error.value = api.errorMessage(output);
    pending.value = false;
};


const onPaste = (event: ClipboardEvent) => {
    const items : DataTransferItemList = (event.clipboardData || (<any>event).originalEvent.clipboardData).items;
    if (!items) return;

    for(const index in items) {
        const item = items[index]!;
        if (item.kind !== 'file') continue;

        const file = item.getAsFile();
        if (!file) continue;

        doSearch(file);
        return;
    }
}

useHead({ title: 'Reverse Image Search' });

if (import.meta.server) {
    useSeoMeta({
        title: 'Reverse Image Search'
    })
}

onMounted(() => {
    nextTick(() => {
        doSearch(url.value);
    });

    document.onpaste = onPaste;
});

onUnmounted(() => {
    document.onpaste = null;
});

watch(() => url.value, () => doSearch(url.value));
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
