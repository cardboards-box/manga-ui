<template>
    <div
        class="flex row"
        v-if="tags.length > 0 && sources.length > 0"
    >
        <label>Manga Tags:</label>
        <Drawer
            v-for="group in tagGroups"
            :key="group.name"
            :title="group.name"
            :storage-key="`search-manga-tags-${group.key}`"
            default-close
        >
            <ButtonGroupTags
                :options="group.tags"
                v-model:on="tagsInclude"
                v-model:off="tagsExclude"
            />
        </Drawer>

        <div class="flex margin-top" v-if="showMode">
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
            <div class="flex row margin-left">
                <label>Other Actions</label>
                <div class="button-tags">
                    <button @click="reset">
                        <Icon unsize="true" size="16px">refresh</Icon>
                        <p>Reset Tags</p>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" generic="T extends MangaSearchFilter | RecommendationFilter">
import type { booleanish, MangaSearchFilter, MbSource, MbTag, MbTypeTag, RecommendationFilter } from '~/models';
import { ContentRating } from '~/models';

const { isTrue } = useUtils();
const { getRelated } = useMangaUtils();

const props = defineProps<{
    modelValue: T;
    tags: MbTypeTag[];
    sources: MbSource[];
    filteredSources?: string[];
    hideMode?: booleanish;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: T): void;
}>();

const showMode = computed(() => !isTrue(props.hideMode));

const filterSources = computed(() => ('sources' in filters.value ? filters.value.sources : props.filteredSources) ?? []);

const filters = computed({
    get: () => props.modelValue,
    set: (value: T) => emits('update:modelValue', value)
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
    get: () => ('tagsAnd' in filters.value && filters.value.tagsAnd) ?? true,
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
    get: () => ('tagsExAnd' in filters.value && filters.value.tagsExAnd) ?? true,
    set: (value: boolean) => {
        filters.value = {
            ...filters.value,
            tagsExAnd: value
        };
    }
});

type TagGroup = {
    key: string;
    name: string;
    tags: MbTag[];
};

const tagGroups = computed<TagGroup[]>(() => {
    const groupKey = (source: string, sources: MbSource[]) => {
        const s = sources.find(s => s.id === source);
        return `group-${source}:Tags from '${s ? s.name : source}' source`;
    }

    const ratingkey = (rating: ContentRating) => {
        const key = rating === ContentRating.Safe ? 'Safe' :
            rating === ContentRating.Suggestive ? 'Suggestive' :
            rating === ContentRating.Erotica ? 'Erotica' :
            'Pornographic';

        return `rating-${rating}:Tags with ${key} content`;
    }

    const otherKey = 'other:Other Tags';

    const sources = props.sources;
    const filteredSources = filterSources.value ?? [];
    const ratings = filters.value?.ratings ?? [];

    const filtered = props.tags.map(t => {
        const related = getRelated(t, 'MbTagExt') ?? {
            id: t.entity.id,
            manga: 0,
            shared: true
        };

        return {
            tag: t.entity,
            ext: related,
        }
    }).filter(t => {
        if (filteredSources.length > 0
            && !t.ext.shared
            && !filteredSources.some(s => s === t.ext.source))
            return false;

        if (ratings.length > 0
            && t.ext.rating !== undefined
            && !ratings.some(r => r === t.ext.rating))
            return false;

        return true;
    });

    const groups: Record<string, MbTag[]> = {};
    for(const tag of filtered) {
        const keys = (() => {
            const output = [];
            if (tag.ext.rating) output.push(ratingkey(tag.ext.rating));
            if (!tag.ext.shared && tag.ext.source) output.push(groupKey(tag.ext.source, sources));

            if (output.length === 0) output.push(otherKey);
            return output;
        })();

        for(const key of keys) {
            if (!groups[key]) groups[key] = [];
            groups[key].push(tag.tag);
        }
    }

    return Object.keys(groups).map(k => ({
        key: k.split(':')[0]!,
        name: k.split(':')[1]!,
        tags: groups[k] ?? []
    })).toSorted((a, b) => b.name.localeCompare(a.name));
});

const reset = () => {
    filters.value = {
        ...filters.value,
        tags: [],
        tagsAnd: true,
        tagsEx: [],
        tagsExAnd: false
    } as T;
}
</script>
