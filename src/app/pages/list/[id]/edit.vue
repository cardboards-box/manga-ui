<template>
    <Loading v-if="isLoading" />
    <Error v-else-if="fullError || !list" :message="fullError ?? 'List not found'" />
    <div v-else class="max-width flex row margin-top">
        <div class="flex">
            <h3 class="center-vert fill">List: {{ list.entity.name }}</h3>
            <IconBtn
                icon="sync"
                title="Refresh"
                color="shade"
                @click="refreshTrigger = !refreshTrigger"
            />
        </div>

        <p class="margin-top margin-bottom">List Description:</p>
        <InputGroup
            v-model="description"
            placeholder="List Description"
            :is-drawer="false"
        />

        <div class="flex margin-top">
            <CheckBox
                v-model="isPublic"
                label="Publicly Visible"
            />
        </div>

        <div class="flex">
            <div class="fill" />
            <IconBtn
                icon="save"
                text="Save Changes"
                color="primary"
                @click="save()"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
const api = useMangaApi();
const route = useRoute();
const { fetch } = useListHelper();

const id = computed(() => route.params.id!.toString());

const {
    refreshTrigger,
    list,
    error,
    pending,
    remove,
    filter
} = fetch(id);

const description = ref('');
const isPublic = ref(false);
const _loading = ref(false);
const _error = ref<string>();

const isLoading = computed(() => pending.value || _loading.value);
const fullError = computed(() => error.value ?? _error.value);

useHead({
    title: computed(() => 'MB List - ' + (list.value?.entity.name ?? 'List') + ' - Edit')
});

watch(list, (newVal) => {
    if (!newVal) return;

    description.value = newVal.entity.description ?? '';
    isPublic.value = newVal.entity.isPublic;
});

const save = async () => {
    try {
        _loading.value = true;
        await api.promise.list.edit(id.value, isPublic.value, description.value);
        refreshTrigger.value = !refreshTrigger.value;
    } catch (e) {
        _error.value = e?.toString() ?? 'An error occurred while saving the list';
    } finally {
        _loading.value = false;
    }
}
</script>

<style lang="scss" scoped>

</style>
