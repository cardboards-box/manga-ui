<template>
    <Drawer
        title="Manga Tags"
        storage-key="search-manga-tags"
        default-close
        v-if="tags.length > 0 && sources.length > 0"
    >
        <template v-if="!onlyHentaiSources">
            <label>Tags</label>
            <ButtonGroupTags
                :options="safeTags"
                v-model:on="tagsInclude"
                v-model:off="tagsExclude"
            />
        </template>
        <template v-if="hasHentaiSource">
            <label class="margin-top">NSFW Tags</label>
            <ButtonGroupTags
                :options="hentaiTags"
                v-model:on="tagsInclude"
                v-model:off="tagsExclude"
            />
        </template>

        <div class="flex margin-top">
            <div class="flex row margin-right">
                <label>Tag Inclusion Mode</label>
                <ButtonGroupBool
                    v-model="tagsIncludeAnd"
                    on="And"
                    off="Or"
                    on-icon="join_inner"
                    off-icon="orbit"
                />
            </div>
            <div class="flex row margin-left">
                <label>Tag Exclusion Mode</label>
                <ButtonGroupBool
                    v-model="tagsExcludeAnd"
                    on="And"
                    off="Or"
                    on-icon="join_inner"
                    off-icon="orbit"
                />
            </div>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import type { MangaSearchFilter, MbSource, MbTag } from '~/models';
import { ContentRating } from '~/models';

const props = defineProps<{
    modelValue: MangaSearchFilter;
    tags: MbTag[],
    sources: MbSource[]
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: MangaSearchFilter): void;
}>();

const hentaiSources = computed(() => props.sources
    .filter(source => source.defaultRating !== ContentRating.Safe)
    .map(t => t.id));
const hasHentaiSource = computed(() => filters.value.sources &&
    filters.value.sources.length > 0 &&
    filters.value.sources.some(t => hentaiSources.value.includes(t)));
const onlyHentaiSources = computed(() => filters.value.sources &&
    filters.value.sources.length > 0 &&
    filters.value.sources.every(t => hentaiSources.value.includes(t)));

const filters = computed({
    get: () => props.modelValue,
    set: (value: MangaSearchFilter) => emits('update:modelValue', value)
});

const tagsInclude = computed({
    get: () => filters.value.tags ?? [],
    set: (value: string[]) => {
        filters.value = {
            ...filters.value,
            tags: value
        };
    }
});

const tagsIncludeAnd = computed({
    get: () => filters.value.tagsAnd ?? true,
    set: (value: boolean) => {
        filters.value = {
            ...filters.value,
            tagsAnd: value
        };
    }
});

const tagsExclude = computed({
    get: () => filters.value.tagsEx ?? [],
    set: (value: string[]) => {
        filters.value = {
            ...filters.value,
            tagsEx: value
        };
    }
});

const tagsExcludeAnd = computed({
    get: () => filters.value.tagsExAnd ?? true,
    set: (value: boolean) => {
        filters.value = {
            ...filters.value,
            tagsExAnd: value
        };
    }
});

const hentaiTags = computed(() => props.tags
    .filter(t => hentaiSources.value.includes(t.sourceId))
    .toSorted((a, b) => a.name.localeCompare(b.name)));

const safeTags = computed(() => props.tags
    .filter(t => !hentaiSources.value.includes(t.sourceId))
    .toSorted((a, b) => a.name.localeCompare(b.name)));
</script>
