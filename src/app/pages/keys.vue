<template>
    <Loading v-if="loading" />
    <Error v-else-if="errorMessage" :message="errorMessage" show-reset @reset="() => { _error = undefined; refresh(); }" />
    <div v-else class="fill fill-parent flex row scroll-y">
        <div class="max-width flex row">
            <div class="flex margin">
                <h1 class="fill center-vert">API Keys</h1>
                <IconBtn
                    v-if="canRead"
                    icon="refresh"
                    title="Refresh"
                    class="margin-left"
                    @click="refresh()"
                />
            </div>
            <div class="flex margin" v-if="canRead">
                <InputGroup
                    v-model="name"
                    placeholder="API Key Name"
                    @search="createKey"
                    icon="add"
                    class="fill"
                />
            </div>
            <div class="key flex margin" v-for="key in keys" :key="key.id">
                <div class="center-vert bold">{{ key.name }}</div>
                <div class="fill center-vert margin-left">
                    <pre 
                        class="code" 
                        v-if="selectedKey?.id === key.id && displayKey"
                    >{{ displayKey }}</pre>
                </div>
                <IconBtn
                    :icon="selectedKey?.id === key.id ? 'key_off' : 'key'"
                    :title="selectedKey?.id === key.id ? 'Hide Key' : 'Show Key'"
                    @click="fetchKey(key)"
                />
                <IconBtn 
                    icon="delete"
                    title="Delete"
                    color="danger"
                    @click="deleteKey(key.id)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MbApiKey } from '~/models';

const api = useMangaApi();
const { canRead } = useAuthHelper();

const { data, error, pending, refresh } = useAsyncData(
    'keys', async () => {
        if (!canRead.value) return [];
        const result = await api.promise.apiKeys.get();
        if (!api.isSuccess(result)) {
            throw new Error(api.errorMessage(result) ?? 'Failed to get keys');
        }
        return api.data(result);
    }, { immediate: true, watch: [canRead], }
);

const keys = computed(() => data.value ?? []);
const name = ref('');
const _error = ref<string>();
const _loading = ref(false);
const selectedKey = ref<MbApiKey>();
const displayKey = ref<string>();

const errorMessage = computed(() => _error.value ?? error.value?.message ?? '');
const loading = computed(() => _loading.value || pending.value);

const createKey = async () => {
    if (!canRead.value) return;

    try {
        _error.value = undefined;
        _loading.value = true;
        const result = await api.promise.apiKeys.create({ name: name.value });
        if (!api.isSuccess(result)) {
            _error.value = api.errorMessage(result) ?? 'Failed to create key';
            return;
        }
        name.value = '';
        refresh();
    } catch (err) {
        _error.value = (err as Error).message;
    } finally {
        _loading.value = false;
    }
};

const deleteKey = async (id: string) => {
    if (!canRead.value) return;

    try {
        _error.value = undefined;
        _loading.value = true;
        const result = await api.promise.apiKeys.remove(id);
        if (!api.isSuccess(result)) {
            _error.value = api.errorMessage(result) ?? 'Failed to delete key';
            return;
        }
        refresh();
    } catch (err) {
        _error.value = (err as Error).message;
    } finally {
        _loading.value = false;
    }
};

const fetchKey = async (key: MbApiKey) => {
    if (selectedKey.value?.id === key.id) {
        selectedKey.value = undefined;
        displayKey.value = undefined;
        return;
    }

    try {
        _error.value = undefined;
        _loading.value = true;
        selectedKey.value = key;
        const result = await api.promise.apiKeys.key(key.id);
        if (!api.isSuccess(result)) {
            _error.value = api.errorMessage(result) ?? 'Failed to fetch key';
            return;
        }
        displayKey.value = api.data(result);
    } catch (err) {
        _error.value = (err as Error).message;
    } finally {
        _loading.value = false;
    }
}

</script>

<style lang="scss" scoped>

</style>