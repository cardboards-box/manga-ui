<template>
<Loading v-if="pending" />
<Error v-else-if="error" :message="error?.message" />
<div v-else-if="data && manga" class="manga-details flex fill-parent scroll-y">
    <div class="manga-offset-width flex row">
        <div class="manga-header flex row center-horz margin-top">
            <Cover :manga="manga" type="background" width="100%" height="400px" />
            <a class="title" :href="manga.url" target="_blank">{{ manga.displayTitle ?? manga.title }}</a>
        </div>
        <div class="title-select margin flex row rounded">
            <div class="flex margin-top">
                <label class="flex center-vert margin-right">Select a Title: </label>
                <SelectBox
                    v-model="selectedTitle"
                    fill
                >
                    <option :value="manga.title">{{ manga.title }} (Main Title)</option>
                    <option v-for="alt in manga.altTitles" :key="alt" :value="alt">{{ alt }} (Alt Title)</option>
                </SelectBox>
            </div>
            <div class="alt flex margin-top">
                <label class="flex center-vert margin-right">Or Input a custom one: </label>
                <input class="fill" v-model="selectedTitle" />
            </div>
            <p class="alt flex margin-top pad-left mute-light">Leave blank to use the original title.</p>
            <div class="margin-top pad-left">
                <IconBtn
                    icon="save"
                    text="Save Title"
                    color="primary"
                    @click="saveTitle"
                />
            </div>
        </div>

    </div>
</div>
<Error v-else message="Something went wrong :("/>
</template>

<script setup lang="ts">
import { VolumeSort } from '~/models';
const {
    volumed,
    favourite,
    reload,
    resetProgress: reset,
    markAsRead,
    setDisplayTitle
} = useMangaApi();

const { proxy: proxyUrl, toPromise, clone } = useApiHelper();
const { currentUser } = useAuthApi();
const route = useRoute();

const rawLoading = ref(false);
const id = computed(() => +route.params.id.toString());
const sort = computed(() => <VolumeSort | undefined>route.query?.sort?.toString() ?? 'ordinal');
const asc = computed(() => (route.query?.asc?.toString()?.toLowerCase() ?? 'true') === 'true');
const params = ref({ sort: sort.value, asc: asc.value });
const { data, pending: reloading, error, refresh } = await volumed(id.value, params);
const manga = computed(() => data.value?.manga);
const pending = computed(() => rawLoading.value || reloading.value);

const selectedTitle = ref('');

const saveTitle = async () => {
    if (!manga.value) return;
    rawLoading.value = true;

    const title = selectedTitle.value.trim();
    await toPromise(setDisplayTitle(manga.value.id, title));
    rawLoading.value = false;
    await refresh();
}

watch(() => data.value, () => {
    selectedTitle.value = manga.value?.displayTitle ?? manga.value?.title ?? '';
}, { immediate: true });

</script>

<style scoped lang="scss">
$bg-color: var(--bg-color-accent);

.manga-details {
    position: unset;

    .manga-offset-width {
        flex: 1;
        max-width: 1450px;
        margin: 0 auto;
    }

    .manga-header {
        position: relative;
        width: 430px;
        height: auto;

        a.title {
            font-size: 2em;
            text-align: center;
            margin-top: 5px;
            max-width: 100%;
            word-break: break-word;
        }

        .buttons {
            flex-flow: row wrap;
            align-items: center;

            button,
            a {
                margin: 5px;

                p { display: none; }
            }
        }
    }

    .title-select {
        padding: var(--margin);
        background-color: $bg-color;
    }
}
</style>
