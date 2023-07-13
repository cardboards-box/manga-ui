<template>
<main class="volume-list fill flex row">
    <header class="flex">
        <p class="fill">Chapters</p>
        <p>Sort</p>
        <div class="btn-group no-top">
            <IconBtn 
                :icon="s.icon"
                v-for="s in sorts"
                :link="url(s.key)"
                :other-classes="s.key === actSort ? 'active' : ''"
            />
        </div>
        <IconBtn 
            icon="sort"
            :rotate="actAsc ? 0 : 180"
            :flip="!actAsc"
            :link="url(undefined, !actAsc)"
        />
        <IconBtn 
            @click="collapseToggle" 
            :icon="allCollapsed ? 'remove' : 'add'"
        />
    </header>
    <Loading v-if="volumes.length === 0" />
    <template v-else>
        <Volume v-for="(vol, index) in volumes" :volume="vol" :index="index" :progress="progress" />
    </template>
</main>
</template>

<script setup lang="ts">
import { MangaVolumed, Progress, VolumeSort } from '~/models';

const props = defineProps<{
    sort?: VolumeSort;
    asc?: boolean;
    manga?: MangaVolumed;
    reloading?: boolean;
    progress?: Progress;
}>();

const actSort = computed(() => props.sort ?? 'ordinal');
const actAsc = computed(() => props.asc ?? true);

const volumes = computed(() => props.manga?.volumes ?? []);
const allCollapsed = computed(() => !!volumes.value.find(t => !t.collapse));

const sorts : { key: VolumeSort, icon: string }[] = [
    { key: 'ordinal', icon: 'list' },
    { key: 'date', icon: 'calendar_month' },
    { key: 'language', icon: 'translate' },
    { key: 'title', icon: 'sort_by_alpha' },
    { key: 'read', icon: 'done_all' }
];

const url = (s?: VolumeSort, a?: boolean) => {
    return `/manga/${props.manga?.manga?.id}?sort=${s ?? actSort.value}&asc=${a ?? actAsc.value}`;
}

const collapseToggle = () => {
    const collapse = allCollapsed.value;
    for (let vol of volumes.value)
        vol.collapse = collapse;
};

</script>

<style scoped lang="scss">
.volume-list {
    padding: 5px;

    header {
        background-color: var(--bg-color-accent-dark);
        border-radius: var(--brd-radius);
        overflow: hidden;
        position: sticky;
        min-height: 50px;

        p {
            margin: auto 5px;
        }
    }
}
</style>