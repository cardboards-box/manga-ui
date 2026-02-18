<template>
    <div class="tags-select">
        <div class="search">
            <InputGroup
                v-model="search"
                placeholder="Filter Tags"
            >
                <template #input>
                    <CheckBox v-model="safeOnly" class="margin-right">
                        Hide NSFW
                    </CheckBox>
                </template>
            </InputGroup>
        </div>
        <div
            class="tag flex"
            v-for="tag in allTags" :key="tag.id"
            @click="toggleTag(tag)"
        >
            <Icon>{{ isActive(tag) ? 'check_box' : 'check_box_outline_blank' }}</Icon>
            <span class="center-vert margin-left fill">{{ tag.name }}</span>
            <span class="nsfw" v-if="!isSafe(tag)">NSFW</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ContentRating } from '~/models';
import type { MbTag } from '~/models';

const { get } = useCacheHelper();

const props = defineProps<{
    modelValue?: string[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[] | undefined): void;
}>();

const tags = computed({
    get: () => props.modelValue ?? [],
    set: (val) => emit('update:modelValue', val)
});

const search = ref('');
const safeOnly = ref(false);
const { data: cached } = useAsyncData(async () => await get());
const allTags = computed(() => {
    let tags = (cached.value?.tags ?? []).toSorted((a, b) => a.name.localeCompare(b.name));
    if (search.value) {
        tags = tags.filter(t => t.name.toLowerCase().includes(search.value.toLowerCase()));
    }
    if (safeOnly.value) {
        tags = tags.filter(isSafe);
    }
    return tags;
});
const sources = computed(() => cached.value?.sources ?? []);

const isSafe = (tag: MbTag) => {
    const source = sources.value?.find(s => s.id === tag.sourceId);
    return source?.defaultRating === ContentRating.Safe;
}

const isActive = (tag: MbTag) => {
    return tags.value?.includes(tag.id) ?? false;
}

const toggleTag = (tag: MbTag) => {
    if (isActive(tag)) {
        tags.value = tags.value.filter(t => t !== tag.id);
    } else {
        tags.value = [...tags.value, tag.id];
    }
}

</script>

<style lang="scss" scoped>
.tags-select {
    display: flex;
    flex-flow: row wrap;
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--color-primary);
    border-radius: var(--brd-radius);

    .search {
        flex: 1;
        min-width: calc(100% - 2 * var(--margin));
        padding: var(--margin);
    }

    .tag {
        min-width: min(250px, 90vw);
        margin: var(--margin) auto;

        &:hover {
            cursor: pointer;
        }

        .nsfw {
            font-size: 0.5em;
            margin: auto 0;
            color: red;
            border: 1px solid red;
            padding: 2px;
            border-radius: var(--brd-radius);
        }
    }
}
</style>
