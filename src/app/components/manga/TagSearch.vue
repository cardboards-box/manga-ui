<template>
<div
    v-if="tags.length > 0 && sources.length > 0"
    class="tag-search-wrap"
>
    <Dropdown
        v-model="open"
        match-width
        :min-width="280"
        :max-height="520"
        panel-class="tag-search-panel"
        class="tag-search"
    >
        <template #trigger="{ triggerProps }">
            <div
                v-bind="triggerProps"
                class="tag-search-trigger"
                @click="focusInput"
            >
                <div
                    v-if="selectedTags.length && !open"
                    class="tag-search-collapsed-pills"
                    @click.stop="open = true"
                >
                    <button
                        v-for="tag in selectedTags"
                        :key="tag.id"
                        type="button"
                        class="tag-pill"
                        :class="tag.state"
                        :title="pillTitle(tag)"
                        @click.stop="cycleTag(tag.id)"
                    >
                        <Icon unsize="true" size="15px">{{ tag.state === 'exclude' ? 'remove' : 'add' }}</Icon>
                        <span>{{ tag.name }}</span>
                    </button>
                </div>
                <input
                    ref="input"
                    v-model="search"
                    class="tag-search-input"
                    type="text"
                    :placeholder="placeholderText"
                    @focus="open = true"
                    @keydown.enter.prevent="selectFirst"
                    @keydown.esc.stop="open = false"
                    @click.stop
                />
                <IconBtn
                    v-if="search"
                    icon="backspace"
                    inline
                    icon-size="16px"
                    title="Clear search"
                    @click="clearSearch"
                />
                <IconBtn
                    v-if="selectedTags.length"
                    icon="close"
                    inline
                    icon-size="16px"
                    title="Reset tags"
                    @click="reset"
                />
                <Icon unsize="true" size="18px">{{ open ? 'expand_less' : 'expand_more' }}</Icon>
            </div>
        </template>

        <div class="tag-search-content">
            <div
                v-if="selectedTags.length"
                class="selected-tags"
            >
                <button
                    v-for="tag in selectedTags"
                    :key="tag.id"
                    type="button"
                    class="selected-tag"
                    :class="tag.state"
                    :title="pillTitle(tag)"
                    @click.stop="cycleTag(tag.id)"
                    @pointerdown.stop
                >
                    <Icon unsize="true" size="15px">{{ tag.state === 'exclude' ? 'remove' : 'add' }}</Icon>
                    <span>{{ tag.name }}</span>
                </button>
            </div>

            <div class="tag-options">
                <button
                    v-for="tag in pageTags"
                    :key="tag.entity.id"
                    type="button"
                    class="tag-option"
                    :class="state(tag.entity.id)"
                    :title="tag.entity.description"
                    @click.stop="cycleTag(tag.entity.id)"
                    @pointerdown.stop
                >
                    <Icon
                        v-if="state(tag.entity.id) !== 'none'"
                        unsize="true"
                        size="15px"
                    >{{ optionIcon(tag.entity.id) }}</Icon>
                    <span>{{ tagName(tag) }}</span>
                </button>
            </div>

            <div
                v-if="pages > 1"
                class="tag-pager"
            >
                <button
                    type="button"
                    class="tag-page-button"
                    :disabled="page <= 1"
                    title="First page"
                    @click.stop="goPage(1)"
                    @pointerdown.prevent.stop
                    @mousedown.prevent.stop
                >
                    <Icon unsize="true" size="18px">keyboard_double_arrow_left</Icon>
                </button>
                <button
                    type="button"
                    class="tag-page-button"
                    :disabled="page <= 1"
                    title="Previous page"
                    @click.stop="goPage(page - 1)"
                    @pointerdown.prevent.stop
                    @mousedown.prevent.stop
                >
                    <Icon unsize="true" size="18px">chevron_left</Icon>
                </button>
                <span>{{ page }} / {{ pages }}</span>
                <button
                    type="button"
                    class="tag-page-button"
                    :disabled="page >= pages"
                    title="Next page"
                    @click.stop="goPage(page + 1)"
                    @pointerdown.prevent.stop
                    @mousedown.prevent.stop
                >
                    <Icon unsize="true" size="18px">chevron_right</Icon>
                </button>
                <button
                    type="button"
                    class="tag-page-button"
                    :disabled="page >= pages"
                    title="Last page"
                    @click.stop="goPage(pages)"
                    @pointerdown.prevent.stop
                    @mousedown.prevent.stop
                >
                    <Icon unsize="true" size="18px">keyboard_double_arrow_right</Icon>
                </button>
            </div>

            <p
                v-if="message"
                class="tag-message"
            >{{ message }}</p>
        </div>
    </Dropdown>

    <div
        v-if="showMode"
        class="tag-mode"
    >
        <div>
            <label>Tag Inclusion Mode</label>
            <ButtonGroupBool
                v-model="tagsIncludeAnd"
                on="And"
                off="Or"
                on-icon="join_inner"
                off-icon="orbit"
            />
        </div>
        <div>
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
</div>
</template>

<script setup lang="ts" generic="T extends MangaSearchFilter | RecommendationFilter">
import Fuse from 'fuse.js';
import type { booleanish, MangaSearchFilter, MbSource, MbTag, MbTagExt, MbTypeTag, RecommendationFilter } from '~/models';
import { ContentRating } from '~/models';

type TagState = 'include' | 'exclude';
type SearchableTag = {
    tag: MbTypeTag;
    name: string;
    slug: string;
    description: string;
    rating: string;
    source: string;
};

const PAGE_SIZE = 80;

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

const open = ref(false);
const search = ref('');
const page = ref(1);
const input = ref<HTMLInputElement>();

const showMode = computed(() => !isTrue(props.hideMode));
const filters = computed({
    get: () => props.modelValue,
    set: (value: T) => emits('update:modelValue', value)
});

const filterSources = computed(() => ('sources' in filters.value ? filters.value.sources : props.filteredSources) ?? []);

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

const tagById = computed(() => Object.fromEntries(props.tags.map(tag => [tag.entity.id, tag])));

const selectedTags = computed(() => {
    const include = tagsInclude.value.map(id => selectedTag(id, 'include'));
    const exclude = tagsExclude.value.map(id => selectedTag(id, 'exclude'));
    return [...include, ...exclude].toSorted((a, b) => a.name.localeCompare(b.name));
});

const filteredTags = computed(() => {
    const selectedSources = filterSources.value ?? [];
    const ratings = filters.value.ratings ?? [];

    return props.tags.filter(tag => {
        const ext = tagExt(tag);
        const source = tagSourceId(tag, ext);

        if (selectedSources.length > 0
            && !ext.shared
            && source
            && !selectedSources.some(selected => selected === source))
            return false;

        if (ratings.length > 0
            && ext.rating !== undefined
            && !ratings.some(rating => rating === ext.rating))
            return false;

        return true;
    }).toSorted((a, b) => a.entity.name.localeCompare(b.entity.name));
});

const searchableTags = computed<SearchableTag[]>(() => filteredTags.value.map(tag => {
    const ext = tagExt(tag);
    const sourceId = tagSourceId(tag, ext);
    const source = ext.shared ? undefined : props.sources.find(s => s.id === sourceId);

    return {
        tag,
        name: tag.entity.name,
        slug: tag.entity.slug,
        description: tag.entity.description ?? '',
        rating: ext.rating === undefined ? '' : ratingText(ext.rating),
        source: source ? `${source.name} ${source.slug} ${source.id}` : (sourceId ?? '')
    };
}));

const fuse = computed(() => new Fuse(searchableTags.value, {
    threshold: .34,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
        { name: 'name', weight: 4 },
        { name: 'slug', weight: 3 },
        { name: 'description', weight: 2 },
        { name: 'rating', weight: 2 },
        { name: 'source', weight: 2 }
    ]
}));

const resultTags = computed(() => {
    const term = search.value.trim();
    if (!term) return filteredTags.value;
    return fuse.value.search(term).map(result => result.item.tag);
});

const pages = computed(() => Math.max(1, Math.ceil(resultTags.value.length / PAGE_SIZE)));

const pageTags = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE;
    return resultTags.value.slice(start, start + PAGE_SIZE);
});

const placeholderText = computed(() => selectedTags.value.length && !open.value
    ? 'Search tags'
    : 'Search tags, ratings, or sources');

const message = computed(() => {
    if (resultTags.value.length === 0) return 'No matching tags';
    return undefined;
});

function tagExt(tag: MbTypeTag): MbTagExt {
    return getRelated(tag, 'MbTagExt') ?? {
        id: tag.entity.id,
        manga: 0,
        shared: true
    };
}

function tagSourceId(tag: MbTypeTag, ext = tagExt(tag)) {
    return ext.source ?? tag.entity.sourceId;
}

function selectedTag(id: string, state: TagState) {
    const tag = tagById.value[id]?.entity ?? fallbackTag(id);
    return {
        id,
        name: formatTagName(tag.name),
        state
    };
}

function fallbackTag(id: string): MbTag {
    return {
        id,
        createdAt: '',
        updatedAt: '',
        name: id,
        slug: id,
        sourceId: '',
    };
}

function ratingText(rating: ContentRating) {
    switch (rating) {
        case ContentRating.Safe: return 'Safe';
        case ContentRating.Suggestive: return 'Suggestive';
        case ContentRating.Erotica: return 'Erotica';
        case ContentRating.Pornographic: return 'Pornographic';
    }
}

function state(id: string): TagState | 'none' {
    if (tagsInclude.value.includes(id)) return 'include';
    if (tagsExclude.value.includes(id)) return 'exclude';
    return 'none';
}

function cycleTag(id: string) {
    const include = tagsInclude.value.filter(tagId => tagId !== id);
    const exclude = tagsExclude.value.filter(tagId => tagId !== id);

    switch (state(id)) {
        case 'include':
            updateTags(include, [...exclude, id]);
            break;
        case 'exclude':
            updateTags(include, exclude);
            break;
        default:
            updateTags([...include, id], exclude);
            break;
    }
}

function updateTags(include: string[], exclude: string[]) {
    filters.value = {
        ...filters.value,
        tags: include,
        tagsEx: exclude
    };
}

function optionIcon(id: string) {
    switch (state(id)) {
        case 'include': return 'add_circle';
        case 'exclude': return 'remove_circle';
        default: return 'radio_button_unchecked';
    }
}

function tagName(tag: MbTypeTag) {
    return formatTagName(tag.entity.name);
}

function formatTagName(value: string) {
    return value
        .split(/([\s/_-]+)/)
        .map(part => /^[\s/_-]+$/.test(part)
            ? part
            : part ? part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase() : part)
        .join('');
}

function pillTitle(tag: { name: string; state: TagState }) {
    return `${tag.state === 'exclude' ? 'Excluded' : 'Included'}: ${tag.name}`;
}

function focusInput() {
    open.value = true;
    nextTick(() => input.value?.focus());
}

function clearSearch() {
    search.value = '';
    page.value = 1;
    nextTick(() => input.value?.focus());
}

function selectFirst() {
    const first = pageTags.value[0];
    if (first) cycleTag(first.entity.id);
}

function goPage(value: number) {
    page.value = Math.max(1, Math.min(value, pages.value));
    open.value = true;
    nextTick(() => input.value?.focus());
}

function reset() {
    filters.value = {
        ...filters.value,
        tags: [],
        tagsAnd: true,
        tagsEx: [],
        tagsExAnd: false
    } as T;
}

watch(search, () => {
    page.value = 1;
});

watch(page, value => {
    if (value < 1) page.value = 1;
    if (value > pages.value) page.value = pages.value;
});

watch(pages, value => {
    if (page.value > value) page.value = value;
});

watch(open, value => {
    if (value) nextTick(() => input.value?.focus());
});
</script>

<style scoped lang="scss">
.tag-search-wrap,
.tag-search {
    display: block;
    max-width: 100%;
    min-width: 0;
    width: 100%;
}

.tag-search-wrap {
    box-sizing: border-box;
    flex: 0 1 auto;
}

.tag-search {
    width: 100%;
}

.tag-search-trigger {
    align-items: center;
    background-color: var(--bg-color-accent);
    border: 1px solid var(--bg-color-accent);
    border-radius: var(--brd-radius);
    color: var(--color);
    display: flex;
    gap: 8px;
    min-height: 42px;
    box-sizing: border-box;
    padding: 6px 8px;
    width: 100%;

    &:focus-within,
    &:hover {
        border-color: var(--color-primary);
    }
}

.tag-search-collapsed-pills {
    display: flex;
    flex: 0 1 auto;
    gap: 5px;
    max-width: 75%;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
}

.tag-pill,
.selected-tag {
    align-items: center;
    border: 1px solid transparent;
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    flex: 0 0 auto;
    gap: 5px;
    min-width: 0;
    padding: 3px 7px;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &.include {
        background-color: var(--color-primary);
    }

    &.exclude {
        background-color: var(--color-warning);
    }

    &:hover {
        border-color: var(--color);
    }
}

.tag-search-input {
    background: transparent;
    border: 0;
    box-sizing: border-box;
    color: var(--color);
    flex: 1 1 10ch;
    min-width: 10ch;
    outline: 0;
    width: auto;
}

.tag-search-content {
    padding: 8px;
}

.selected-tags {
    border-bottom: 1px solid var(--bg-color-accent-dark);
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 8px;
    max-height: 120px;
    overflow-y: auto;
    padding-bottom: 8px;
}

.tag-options {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.tag-option {
    align-items: center;
    background-color: var(--bg-color-accent);
    border: 1px solid var(--color-muted-light);
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    gap: 5px;
    max-width: 100%;
    min-height: 28px;
    min-width: 0;
    padding: 4px 8px;
    text-align: left;

    &:hover,
    &.include,
    &.exclude {
        background-color: var(--bg-color-accent-dark);
        border-color: var(--color);
    }

    &.include {
        border-color: var(--color-primary);
    }

    &.exclude {
        border-color: var(--color-warning);
    }

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.tag-message,
.tag-pager {
    color: var(--color-muted-light);
    font-size: .85rem;
}

.tag-pager {
    align-items: center;
    display: flex;
    gap: 12px;
    justify-content: center;
    padding: 8px 0 2px;
}

.tag-page-button {
    align-items: center;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    padding: 4px;

    &:hover:not(:disabled) {
        background-color: var(--bg-color-accent);
        border-color: var(--bg-color-accent-dark);
        cursor: pointer;
    }

    &:disabled {
        color: var(--color-muted-light);
        opacity: .6;
    }
}

.tag-message {
    margin: 8px 2px 2px;
}

.tag-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
    padding-top: 8px;
}
</style>
