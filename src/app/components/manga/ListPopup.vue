<template>
    <div class="list-popup flex" :class="{ open: isOpen }">
        <div class="fade" @click="close" />
        <div class="list-content center flex row">
            <header class="flex">
                <h3 class="fill center-vert margin-right">Modify List</h3>
                <IconBtn
                    icon="close"
                    @click="close"
                    inline
                    class="center-vert"
                    title="Close Popup"
                />
            </header>
            <Loading v-if="loading" />
            <template v-else-if="!manga?.length || error">
                <div class="list-body flex row">
                    <Error  :message="error ?? 'No manga found, how\'d you get here?'" />
                </div>
                <footer class="flex" v-if="_error">
                    <IconBtn
                        icon="check_small"
                        @click="() => _error = undefined"
                        text="Ok"
                        class="pad-left"
                        color="primary"
                    />
                </footer>
            </template>
            <template v-else-if="page === 'list'">
                <div class="list-body flex row">
                    <div class="list-item flex" v-if="!matchedLists.length">
                        <p>No lists found, create a new one!</p>
                    </div>
                    <div
                        class="list-item flex"
                        v-for="list in matchedLists"
                        :key="list.id"
                    >
                        <p class="fill center-vert">{{ list.name }}</p>
                        <IconBtn
                            v-if="list.status === 'not-found' || list.status === 'partial-found'"
                            icon="add"
                            :title="`Add ${manga.length - list.matched} manga`"
                            @click="() => addAll(list)"
                            inline
                            class="center-vert"
                        />
                        <IconBtn
                            v-if="list.status === 'all-found' || list.status === 'partial-found'"
                            icon="remove"
                            :title="`Remove ${list.matched} manga`"
                            @click="() => removeAll(list)"
                            inline
                            class="center-vert"
                        />
                    </div>
                </div>
                <footer class="flex">
                    <p class="mute fill center-vert">{{ manga.length }} manga selected</p>
                    <IconBtn
                        icon="edit"
                        @click="() => page = 'create'"
                        text="Create new list"
                        color="primary"
                    />
                </footer>
            </template>
            <template v-else>
                <div class="list-body flex row">
                    <p class="center-horz margin-bottom">Create a new list:</p>
                    <label class="mute margin-left">List Name:</label>
                    <InputGroup
                        v-model="name"
                        placeholder="List Name"
                        class="margin-bottom"
                    />
                    <label class="mute margin-left">List Description:</label>
                    <InputGroup
                        v-model="description"
                        placeholder="List Description"
                        class="margin-bottom"
                    />
                    <CheckBox
                        v-model="isPublic"
                        class="margin-left"
                    >
                        <b class="margin-left">Public</b>
                        <span class="mute">&nbsp;- Visible to everyone</span>
                    </CheckBox>
                </div>
                <footer class="flex">
                    <p class="mute fill center-vert">{{ lists?.length ?? 0 }} list{{ lists?.length === 1 ? '' : 's' }}</p>
                    <IconBtn
                        icon="save"
                        @click="createList"
                        text="Save"
                        color="primary"
                    />
                    <IconBtn
                        icon="cancel"
                        @click="() => page = 'list'"
                        class="margin-left"
                        text="Cancel"
                        color="danger"
                    />
                </footer>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MbList } from '~/models';

type MatchType = 'not-found' | 'all-found' | 'partial-found';
type MatchedList = MbList & {
    status: MatchType;
    matched: number;
}

const api = useMangaApi();
const { lists: fetchLists, add, remove } = useListHelper();
const { canRead } = useAuthHelper();
const { getRelateds } = useMangaUtils();

const props = defineProps<{
    modelValue: string[] | undefined;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: string[] | undefined): void;
}>();

const mangaIds = computed({
    get: () => props.modelValue,
    set: (value) => emits('update:modelValue', value)
});

const _pending = ref(false);
const _error = ref<string>();
const page = ref<'list' | 'create'>('list');
const name = ref('Definitely Not Porn');
const isPublic = ref(false);
const description = ref('My fancy list!');
const { pending: listPending, data: lists, refresh: refreshLists, error: listError } = fetchLists();
const isOpen = computed(() => mangaIds.value && mangaIds.value.length > 0 && canRead.value);

const { pending: progressPending, data: manga, refresh: refreshManga, error: mangaError } = useAsyncData(
    () => `manga-list-progress-${mangaIds.value?.join(',')}`,
    async () => {
        if (!isOpen.value || !mangaIds.value || mangaIds.value.length === 0) return [];

        const progress = await api.promise.progress.get(mangaIds.value);
        if (!api.isSuccess(progress)) return [];

        return api.data(progress) ?? [];
    }, { watch: [isOpen, mangaIds] }
);

const loading = computed(() => _pending.value || listPending.value || progressPending.value);
const error = computed(() => _error.value || listError.value?.message || mangaError.value?.message);
const matchedLists = computed<MatchedList[]>(() => lists.value?.map(list => ({
    ...list,
    ...isInList(list)
})) ?? []);

const close = () => {
    _error.value = undefined;
    _pending.value = false;
    page.value = 'list';
    name.value = 'Definitely Not Porn';
    isPublic.value = false;
    description.value = 'My fancy list!';
    mangaIds.value = undefined;
}

function isInList(list: MbList): { status: MatchType; matched: number } {
    const foundLists = manga.value?.filter(t => {
        const lists = getRelateds(t, 'MbList');
        return lists?.some(l => l.id === list.id);
    }).length ?? 0;

    const status = foundLists === 0 ? 'not-found'
        : foundLists === manga.value?.length ? 'all-found'
        : 'partial-found';
    return { status, matched: foundLists };
}

const addAll = (list: MatchedList) => {
    return mod(list, true);
}

const removeAll = (list: MatchedList) => {
    return mod(list, false);
}

const mod = async (list: MatchedList, doAdd: boolean) => {
    const ids = manga.value
        ?.filter(t => {
            const lists = getRelateds(t, 'MbList');
            const exists = lists?.some(l => l.id === list.id);
            return doAdd ? !exists : exists;
        })
        .map(m => m.entity.mangaId) ?? [];
    if (ids.length === 0) return;

    _pending.value = true;
    _error.value = undefined;

    try {
        await Promise.all(ids.map(id => doAdd ? add(list.id, id) : remove(list.id, id)));
        await Promise.all([refreshManga(), refreshLists()]);
    } catch (error) {
        _error.value = (error as Error)?.message ?? 'An unknown error occurred';
    } finally {
        _pending.value = false;
    }
}

const createList = async () => {
    const nm = name.value.trim();
    if (!nm) {
        _error.value = 'List name cannot be empty';
        return;
    }

    const exists = lists.value?.some(t => t.name.toLowerCase() === nm.toLowerCase());
    if (exists) {
        _error.value = 'List name must be unique';
        return;
    }

    _pending.value = true;
    try {
        const result = await api.promise.list.create(nm, isPublic.value, description.value);
        if (!api.isSuccess(result)) {
            _error.value = api.errorMessage(result) ?? 'An error occurred!';
            return;
        }

        await refreshLists();
        page.value = 'list';
    } catch (ex) {
        _error.value = (ex as Error)?.message ?? 'An unknown error occurred';
    } finally {
        _pending.value = false;
    }
}

</script>

<style scoped lang="scss">
.list-popup {
    position: fixed;
    top: -100%;
    left: 0;
    width: var(--full-width);
    height: var(--full-height);
    transition: top 0.3s ease-in-out;
    z-index: 9999;

    .fade {
        transition: opacity 0.3s ease-in-out;
    }

    .list-content {
        border: 1px solid var(--bg-color-offset);
        border-radius: calc(var(--brd-radius) * 2);
        background-color: var(--bg-color);
        overflow: hidden;
        min-width: min(450px, 90%);

        header, footer, .list-body {
            padding: var(--margin);
            background-color: var(--bg-color-accent-dark);
        }

        header {
            border-bottom: 1px solid var(--bg-color-offset);
        }

        .list-body {
            background-color: var(--bg-color);
            min-height: min(300px, 90vh);
            max-height: 80vh;
            overflow-y: auto;

            .list-item {
                border-bottom: 1px dashed var(--color-muted);

                &:last-child {
                    border-bottom: 0;
                }
            }
        }

        footer {
            border-top: 1px solid var(--bg-color-offset);
        }
    }

    &.open {
        top: 0;

        .fade {
            opacity: 1;
        }
    }
}
</style>
