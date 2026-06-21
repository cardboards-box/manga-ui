<template>
    <Error v-if="!isAdmin" message="Tag administration is not available." />
    <main v-else class="tag-admin max-width scroll-y">
        <div class="tag-admin-sticky">
            <header class="tag-admin-header">
                <div>
                    <h2>Tags</h2>
                    <p>{{ filteredTags.length }} / {{ drafts.length }} tags</p>
                </div>
                <div class="tag-admin-actions">
                    <IconBtn
                        icon="sync"
                        text="Reload"
                        color="shade"
                        :loading="pending"
                        @click="reload"
                    />
                    <IconBtn
                        icon="save"
                        text="Save"
                        color="primary"
                        :alert-text="dirtyDrafts.length ? dirtyDrafts.length.toString() : undefined"
                        :disabled="dirtyDrafts.length === 0 || saving"
                        :loading="saving"
                        @click="saveDirty"
                    />
                </div>
            </header>

            <section class="tag-admin-toolbar">
                <InputGroup
                    v-model="search"
                    placeholder="Search tags"
                >
                    <div class="toolbar-grid">
                        <label>
                            <span>Show</span>
                            <select v-model="showMode">
                                <option value="all">All tags</option>
                                <option value="dirty">Unsaved only</option>
                                <option value="selected">Selected only</option>
                            </select>
                        </label>
                        <label>
                            <span>Sort</span>
                            <select v-model="sortMode">
                                <option value="name">Name</option>
                                <option value="slug">Slug</option>
                                <option value="manga">Manga count</option>
                                <option value="updated">Updated</option>
                            </select>
                        </label>
                    </div>
                </InputGroup>

                <div class="merge-panel">
                    <label>
                        <span>Primary</span>
                        <select v-model="primaryId">
                            <option value="">Choose a tag</option>
                            <option
                                v-for="tag in primaryOptions"
                                :key="tag.id"
                                :value="tag.id"
                            >{{ tag.name }} ({{ tag.slug }})</option>
                        </select>
                    </label>
                    <div class="merge-summary">
                        <span class="merge-count">{{ mergeIds.length }} selected for merge</span>
                        <IconBtn
                            icon="merge"
                            text="Merge"
                            color="warning"
                            :disabled="!canMerge || merging"
                            :loading="merging"
                            @click="mergeTags"
                        />
                    </div>
                </div>

                <p v-if="message" class="tag-admin-message" :class="{ error: messageIsError }">{{ message }}</p>
            </section>
        </div>

        <section v-if="pending" class="tag-admin-state">
            <Loading />
        </section>
        <section v-else-if="rawError" class="tag-admin-state">
            <Error :message="rawError.message" />
        </section>
        <section v-else class="tag-table-wrap">
            <table class="tag-table">
                <thead>
                    <tr>
                        <th class="select-col">Merge</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Aliases</th>
                        <th class="meta-col">Manga</th>
                        <th class="action-col">State</th>
                    </tr>
                </thead>
                <tbody>
                    <template
                        v-for="tag in filteredTags"
                        :key="tag.id"
                    >
                        <tr
                            class="summary-row"
                            :class="{ dirty: tag.dirty, primary: tag.id === primaryId, open: expandedId === tag.id }"
                            @click="toggleExpanded(tag.id)"
                        >
                            <td class="select-col">
                                <CheckBox
                                    :model-value="selectedIds.includes(tag.id)"
                                    :disabled="tag.id === primaryId"
                                    @update:model-value="() => toggleSelected(tag.id)"
                                />
                            </td>
                            <td>
                                <div class="tag-name">
                                    <Icon unsize="true" size="18px">{{ expandedId === tag.id ? 'expand_less' : 'expand_more' }}</Icon>
                                    <span>{{ tag.name }}</span>
                                </div>
                            </td>
                            <td>{{ tag.slug }}</td>
                            <td class="description-cell">{{ tag.description || 'No description' }}</td>
                            <td>
                                <div class="alias-preview">
                                    <span
                                        v-for="alias in tag.aliases.slice(0, 4)"
                                        :key="alias"
                                        class="alias-pill"
                                    >{{ alias }}</span>
                                    <span v-if="tag.aliases.length > 4" class="alias-more">+{{ tag.aliases.length - 4 }}</span>
                                    <span v-if="tag.aliases.length === 0" class="muted">None</span>
                                </div>
                            </td>
                            <td class="meta-col">{{ tag.manga }}</td>
                            <td class="action-col">
                                <span :class="{ dirtyText: tag.dirty }">{{ tag.dirty ? 'Unsaved' : 'Saved' }}</span>
                            </td>
                        </tr>
                        <tr
                            v-if="expandedId === tag.id"
                            class="edit-row"
                        >
                            <td colspan="7">
                                <div class="edit-drawer">
                                    <label>
                                        <span>Name</span>
                                        <input
                                            v-model="tag.name"
                                            type="text"
                                            @input="markDirty(tag)"
                                        />
                                    </label>
                                    <label>
                                        <span>Description</span>
                                        <input
                                            v-model="tag.description"
                                            type="text"
                                            @input="markDirty(tag)"
                                        />
                                    </label>
                                    <label class="alias-editor">
                                        <span>Aliases</span>
                                        <div class="pill-input">
                                            <button
                                                v-for="alias in tag.aliases"
                                                :key="alias"
                                                type="button"
                                                class="alias-pill removable"
                                                @click="removeAlias(tag, alias)"
                                            >
                                                <span>{{ alias }}</span>
                                                <Icon unsize="true" size="14px">close</Icon>
                                            </button>
                                            <input
                                                v-model="tag.aliasInput"
                                                type="text"
                                                placeholder="Add alias"
                                                @keydown="onAliasKeydown($event, tag)"
                                                @blur="addAlias(tag)"
                                            />
                                        </div>
                                    </label>
                                    <div class="edit-actions">
                                        <IconBtn
                                            icon="star"
                                            text="Primary"
                                            color="shade"
                                            :disabled="primaryId === tag.id"
                                            @click="primaryId = tag.id"
                                        />
                                        <IconBtn
                                            icon="restart_alt"
                                            text="Reset"
                                            color="shade"
                                            :disabled="!tag.dirty"
                                            @click="resetDraft(tag.id)"
                                        />
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </section>
    </main>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js';
import type { MbTag, MbTagExt, MbTypeTag } from '~/models';

type TagDraft = MbTag & {
    aliasText: string;
    aliasInput: string;
    dirty: boolean;
    manga: number;
    searchText: string;
};

type ShowMode = 'all' | 'dirty' | 'selected';
type SortMode = 'name' | 'slug' | 'manga' | 'updated';

const api = useMangaApi();
const cache = useCacheHelper();
const { isAdmin } = useAuthHelper();
const { getRelated } = useMangaUtils();

const search = ref('');
const showMode = ref<ShowMode>('all');
const sortMode = ref<SortMode>('name');
const drafts = ref<TagDraft[]>([]);
const selectedIds = ref<string[]>([]);
const primaryId = ref('');
const expandedId = ref('');
const saving = ref(false);
const merging = ref(false);
const message = ref('');
const messageIsError = ref(false);

const { data, pending, error: rawError, refresh } = useAsyncData(
    'admin-tags',
    async () => {
        if (!isAdmin.value) return [];
        const result = await api.promise.tag.get();
        const error = api.errorMessage(result);
        if (error) throw new Error(error);
        return api.data(result) ?? [];
    },
    { watch: [() => isAdmin.value] }
);

const dirtyDrafts = computed(() => drafts.value.filter(tag => tag.dirty));
const mergeIds = computed(() => selectedIds.value.filter(id => id !== primaryId.value));
const canMerge = computed(() => !!primaryId.value && mergeIds.value.length > 0);

const fuse = computed(() => new Fuse(drafts.value, {
    threshold: .34,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
        { name: 'name', weight: 4 },
        { name: 'slug', weight: 4 },
        { name: 'aliasText', weight: 3 },
        { name: 'description', weight: 2 },
        { name: 'id', weight: 1 },
        { name: 'sourceId', weight: 1 },
        { name: 'searchText', weight: 1 }
    ]
}));

const filteredTags = computed(() => {
    const term = search.value.trim();
    let tags = term ? fuse.value.search(term).map(result => result.item) : [...drafts.value];

    if (showMode.value === 'dirty')
        tags = tags.filter(tag => tag.dirty);
    if (showMode.value === 'selected')
        tags = tags.filter(tag => selectedIds.value.includes(tag.id) || tag.id === primaryId.value);

    return tags.toSorted(sortDrafts);
});

const primaryOptions = computed(() => {
    const ids = new Set([
        ...filteredTags.value.map(tag => tag.id),
        ...selectedIds.value,
        ...(primaryId.value ? [primaryId.value] : [])
    ]);

    return drafts.value
        .filter(tag => ids.has(tag.id))
        .toSorted(sortDrafts);
});

function toDraft(tag: MbTypeTag): TagDraft {
    const entity = tag.entity;
    const ext = getRelated(tag, 'MbTagExt') as MbTagExt | undefined;
    const aliases = [...(entity.aliases ?? [])].toSorted((a, b) => a.localeCompare(b));

    return {
        ...entity,
        aliases,
        description: entity.description ?? '',
        aliasText: aliases.join(', '),
        aliasInput: '',
        dirty: false,
        manga: ext?.manga ?? 0,
        searchText: [
            entity.id,
            entity.sourceId,
            entity.name,
            entity.slug,
            entity.description ?? '',
            ...aliases
        ].join(' ')
    };
}

function toTag(draft: TagDraft): MbTag {
    return {
        id: draft.id,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        deletedAt: draft.deletedAt,
        slug: draft.slug,
        name: draft.name.trim(),
        description: draft.description?.trim() || undefined,
        sourceId: draft.sourceId,
        aliases: parseAliases(`${draft.aliasText},${draft.aliasInput}`, draft.slug)
    };
}

function parseAliases(value: string, slug?: string) {
    return [...new Set(value
        .split(/[\n,]+/)
        .map(item => item.trim().toLocaleLowerCase())
        .filter(item => item && item !== slug))].toSorted((a, b) => a.localeCompare(b));
}

function markDirty(tag: TagDraft) {
    tag.aliasText = tag.aliases.join(', ');
    tag.dirty = true;
}

function toggleExpanded(id: string) {
    expandedId.value = expandedId.value === id ? '' : id;
}

function addAlias(tag: TagDraft) {
    const aliases = parseAliases(tag.aliasInput, tag.slug);
    if (aliases.length === 0) return;

    tag.aliases = [...new Set([...tag.aliases, ...aliases])]
        .toSorted((a, b) => a.localeCompare(b));
    tag.aliasText = tag.aliases.join(', ');
    tag.aliasInput = '';
    tag.dirty = true;
}

function removeAlias(tag: TagDraft, alias: string) {
    tag.aliases = tag.aliases.filter(item => item !== alias);
    tag.aliasText = tag.aliases.join(', ');
    tag.dirty = true;
}

function onAliasKeydown(event: KeyboardEvent, tag: TagDraft) {
    if (event.key !== 'Enter' && event.key !== ',') return;

    event.preventDefault();
    addAlias(tag);
}

function resetDraft(id: string) {
    const original = data.value?.find(tag => tag.entity.id === id);
    if (!original) return;

    drafts.value = drafts.value.map(tag => tag.id === id ? toDraft(original) : tag);
}

function toggleSelected(id: string) {
    selectedIds.value = selectedIds.value.includes(id)
        ? selectedIds.value.filter(item => item !== id)
        : [...selectedIds.value, id];
}

function sortDrafts(a: TagDraft, b: TagDraft) {
    switch (sortMode.value) {
        case 'slug': return a.slug.localeCompare(b.slug);
        case 'manga': return b.manga - a.manga || a.name.localeCompare(b.name);
        case 'updated': return `${b.updatedAt}`.localeCompare(`${a.updatedAt}`);
        default: return a.name.localeCompare(b.name);
    }
}

async function saveDirty() {
    if (dirtyDrafts.value.length === 0) return;

    saving.value = true;
    setMessage('');
    const savedCount = dirtyDrafts.value.length;

    try {
        const result = await api.promise.tag.upsert(dirtyDrafts.value.map(toTag));
        const error = api.errorMessage(result);
        if (error) {
            setMessage(error, true);
            return;
        }

        const updated = api.data(result) ?? [];
        replaceTags(updated);
        cache.clear('tags');
        setMessage(`Saved ${updated.length || savedCount} tags.`);
    } finally {
        saving.value = false;
    }
}

async function mergeTags() {
    if (!canMerge.value) return;

    merging.value = true;
    setMessage('');

    try {
        const result = await api.promise.tag.merge(primaryId.value, mergeIds.value);
        const error = api.errorMessage(result);
        if (error) {
            setMessage(error, true);
            return;
        }

        const merged = api.data(result);
        if (!merged) return;

        drafts.value = drafts.value
            .filter(tag => !merged.deleted.includes(tag.id))
            .map(tag => tag.id === merged.tag.entity.id ? toDraft(merged.tag) : tag);
        selectedIds.value = selectedIds.value.filter(id => !merged.deleted.includes(id));
        primaryId.value = merged.tag.entity.id;
        cache.clear('tags');
        setMessage(`Merged ${merged.deleted.length} tags into ${merged.tag.entity.name}.`);
    } finally {
        merging.value = false;
    }
}

async function reload() {
    setMessage('');
    await refresh();
}

function replaceTags(tags: (MbTypeTag | MbTag)[]) {
    if (tags.length === 0) {
        drafts.value = drafts.value.map(tag => tag.dirty ? { ...tag, dirty: false } : tag);
        return;
    }

    const updated = new Map(tags.map(tag => {
        const draft = toDraft(toTypeTag(tag));
        return [draft.id, draft];
    }));
    drafts.value = drafts.value.map(tag => updated.get(tag.id) ?? tag);
}

function toTypeTag(tag: MbTypeTag | MbTag): MbTypeTag {
    if ('entity' in tag) return tag;
    return {
        entity: tag,
        related: []
    };
}

function setMessage(value: string, isError = false) {
    message.value = value;
    messageIsError.value = isError;
}

watch(data, value => {
    drafts.value = (value ?? []).map(toDraft).toSorted(sortDrafts);
    selectedIds.value = selectedIds.value.filter(id => drafts.value.some(tag => tag.id === id));
    if (primaryId.value && !drafts.value.some(tag => tag.id === primaryId.value))
        primaryId.value = '';
    if (expandedId.value && !drafts.value.some(tag => tag.id === expandedId.value))
        expandedId.value = '';
}, { immediate: true });

watch(primaryId, value => {
    if (!value) return;
    selectedIds.value = selectedIds.value.filter(id => id !== value);
});

useHead({
    title: 'Tag Admin'
});
</script>

<style scoped lang="scss">
.tag-admin {
    padding: var(--margin);
}

.tag-admin-sticky,
.tag-table-wrap {
    max-width: 1500px;
    margin: 0 auto var(--margin);
}

.tag-admin-sticky {
    background-color: var(--bg-color-accent-dark);
    border: 1px solid var(--bg-color-offset);
    border-radius: var(--brd-radius);
    box-shadow: 0 8px 20px rgba(0, 0, 0, .18);
    margin-top: var(--margin);
    padding: 10px;
    position: sticky;
    top: var(--margin);
    z-index: 5;
}

.tag-admin-header {
    align-items: center;
    display: flex;
    gap: var(--margin);
    justify-content: space-between;
    margin-bottom: 10px;

    h2,
    p {
        margin: 0;
    }

    p {
        color: var(--color-muted-light);
    }
}

.tag-admin-actions,
.merge-summary {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag-admin-toolbar {
    display: grid;
    gap: 10px;
}

.toolbar-grid,
.merge-panel {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

    label {
        display: grid;
        gap: 4px;
        min-width: 0;
    }

    span {
        color: var(--color-muted-light);
        font-size: .85rem;
    }
}

.merge-panel {
    align-items: end;
    background-color: var(--bg-color-accent);
    border: 1px solid var(--bg-color-accent-dark);
    border-radius: var(--brd-radius);
    grid-template-columns: minmax(260px, 1fr) auto;
    padding: 10px;

    select {
        min-width: 0;
        width: 100%;
    }
}

.merge-summary {
    justify-content: flex-end;
    min-width: 190px;
}

.merge-count {
    white-space: nowrap;
}

.tag-admin-message {
    margin: 0;
    color: var(--color-primary);

    &.error {
        color: var(--color-warning);
    }
}

.tag-admin-state {
    margin: var(--margin) auto;
    max-width: 700px;
}

.tag-table-wrap {
    overflow-x: auto;
}

.tag-table {
    border-collapse: collapse;
    width: 100%;

    th,
    td {
        border-bottom: 1px solid var(--bg-color-accent);
        padding: 7px;
        text-align: left;
        vertical-align: top;
    }

    th {
        color: var(--color-muted-light);
        font-size: .85rem;
        font-weight: 600;
    }

    tr.dirty {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }

    tr.primary {
        outline: 1px solid var(--color-primary);
        outline-offset: -1px;
    }

    tr.summary-row {
        cursor: pointer;

        &:hover,
        &.open {
            background-color: var(--bg-color-accent);
        }
    }
}

.select-col,
.meta-col,
.action-col {
    white-space: nowrap;
    width: 1%;
}

.inline-action {
    background-color: transparent;
    border: 0;
    color: var(--color-primary);
    padding: 0;
    text-align: left;

    &:hover {
        cursor: pointer;
        text-decoration: underline;
    }
}

.tag-name {
    align-items: center;
    display: flex;
    gap: 6px;
    min-width: 170px;
}

.description-cell {
    color: var(--color-muted-light);
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.alias-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 360px;
}

.alias-pill {
    align-items: center;
    background-color: var(--bg-color-accent-dark);
    border: 1px solid var(--bg-color-accent);
    border-radius: var(--brd-radius);
    color: var(--color);
    display: inline-flex;
    gap: 4px;
    max-width: 220px;
    min-height: 24px;
    padding: 2px 7px;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &.removable:hover {
        border-color: var(--color-warning);
        cursor: pointer;
    }
}

.alias-more,
.muted {
    color: var(--color-muted-light);
}

.dirtyText {
    color: var(--color-primary);
}

.edit-row td {
    background-color: var(--bg-color-accent);
    padding: 0;
}

.edit-drawer {
    display: grid;
    gap: 10px;
    grid-template-columns: minmax(180px, 1fr) minmax(220px, 2fr);
    padding: 12px;

    label {
        display: grid;
        gap: 4px;
        min-width: 0;

        > span {
            color: var(--color-muted-light);
            font-size: .85rem;
        }
    }

    input[type="text"] {
        box-sizing: border-box;
        width: 100%;
    }
}

.alias-editor {
    grid-column: 1 / -1;
}

.pill-input {
    align-items: center;
    background-color: var(--bg-color);
    border: 1px solid var(--bg-color-accent-dark);
    border-radius: var(--brd-radius);
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    min-height: 38px;
    padding: 5px;

    input {
        background: transparent;
        border: 0;
        color: var(--color);
        flex: 1 1 160px;
        min-width: 120px;
        outline: 0;
    }
}

.edit-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    grid-column: 1 / -1;
}

@media only screen and (max-width: 700px) {
    .tag-admin-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .merge-panel,
    .edit-drawer {
        grid-template-columns: 1fr;
    }

    .merge-summary {
        justify-content: flex-start;
    }
}
</style>
