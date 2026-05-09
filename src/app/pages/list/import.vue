<template>
    <Loading v-if="loading" />
    <Error v-else-if="!canRead" message="You need to be logged in to do this!" />
    <Error
        v-else-if="error"
        :message="error"
        show-reset
        @reset="error = undefined"
    />
    <div v-else-if="!response" class="center rounded bg-accent pad flex row import">
        <h2 class="margin-bottom">Import a Custom List from MangaDex</h2>
        <div class="control fill">
            <label>MD List ID or URL</label>
            <input type="text" placeholder="MD List ID or URL" v-model="id" />
        </div>
        <p class="mute margin">We only support public lists</p>

        <div class="control fill">
            <label>List Name (Optional)</label>
            <input type="text" placeholder="List Name" v-model="name" />
        </div>
        <p class="mute margin">The MD list name will be used if none is provided.</p>

        <div class="control fill">
            <label>List Description (Optional)</label>
            <input type="text" placeholder="List Description" v-model="description" />
        </div>
        <p class="mute margin">The MD list description will be used if none is provided.</p>

        <CheckBox v-model="isPublic" label="Publicly Visible" />

        <footer class="flex margin-top">
            <IconBtn icon="add" pad-left @click="importList"  />
        </footer>
    </div>
    <div v-else class="center rounded bg-accent pad flex row import">
        <h2 class="margin-bottom">Your List Was Imported!</h2>
        <p class="margin-bottom"><b>Name:</b> {{ response.list.entity.name }}</p>
        <p class="margin-bottom"><b>Description:</b> {{ response.list.entity.description }}</p>
        <p class="margin-bottom"><b>Manga:</b> {{ mangaCount }}</p>
        <p class="margin-bottom"><b>Publicly Visible:</b> {{ response.list.entity.isPublic }}</p>

        <ul v-if="response.failures && Object.keys(response.failures).length > 0">
            <li><h2>Failures:</h2></li>
            <li v-for="(reason, title) in response.failures" :key="title">
                <b>ID {{ title }}</b> - {{ reason }}
            </li>
        </ul>

        <footer class="flex margin-top">
            <IconBtn
                icon="open_in_new"
                text="View List"
                color="primary"
                pad-left
                :link="`/list/${response.list.entity.id}`"
            />
            <IconBtn
                icon="add"
                text="Import Another List"
                color="primary"
                @click="clear()"
                class="margin-left"
            />
        </footer>

    </div>
</template>

<script lang="ts" setup>
import type { ReqListImportMd, MbListImportResponse } from '~/models';

const api = useMangaApi();
const { canRead } = useAuthHelper();
const { getRelateds } = useMangaUtils();
const { extractUuid } = useUtils();

useHead({ title: 'Import an MD list!' });

const loading = ref(false);
const error = ref<string>();
const response = ref<MbListImportResponse>();
const id = ref('');
const name = ref('');
const description = ref('');
const isPublic = ref(false);

const mangaCount = computed(() => {
    if (!response.value) return 0;
    return getRelateds(response.value.list, 'MbListItem').length;
})

const importList = async () => {
    const uuid = extractUuid(id.value);

    if (!uuid) {
        error.value = 'Please provide a valid MD list URL or ID.';
        return;
    }

    const req: ReqListImportMd = {
        mdListId: uuid,
        name: name.value || undefined,
        description: description.value || undefined,
        isPublic: isPublic.value
    };

    try {
        loading.value = true;
        const result = await api.promise.list.importMd(req);
        if (!api.isSuccess(result)) {
            error.value = api.errorMessage(result);
            return;
        }

        response.value = api.data(result);
    } catch (ex) {
        error.value = 'An unexpected error occurred. Please try again.';
        console.error(ex);
    } finally {
        loading.value = false;
    }
}

const clear = () => {
    id.value = '';
    name.value = '';
    description.value = '';
    isPublic.value = false;
    response.value = undefined;
    error.value = undefined;
}
</script>

<style lang="scss" scoped>
.import {
    p { margin-top: 10px; }
}
</style>
