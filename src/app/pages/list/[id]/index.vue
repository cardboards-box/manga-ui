<template>
    <MangaSearch
        :filters="filter"
        :pending="pending"
        :error="error"
        :title="list?.entity.name"
        :refresh-trigger="refreshTrigger"
    >
        <template #card-title="{ manga }">
            <IconBtn
                @click="remove(manga)"
                inline
                icon="playlist_remove"
                title="Remove from list"
                icon-size=""
            />
        </template>
    </MangaSearch>
</template>

<script setup lang="ts">
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

useHead({ title: computed(() => 'MB List - ' + (list.value?.entity.name ?? 'List')) });
</script>
