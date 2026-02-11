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
                no-boarder
            />
        </div>
        <IconBtn
            icon="sort"
            :rotate="actAsc ? 0 : 180"
            :flip="!actAsc"
            :link="url(undefined, !actAsc)"
            no-boarder
        />
        <IconBtn
            @click="collapseToggle"
            :icon="allCollapsed ? 'remove' : 'add'"
            no-boarder
        />
    </header>
    <Loading v-if="volumes.length === 0" />
    <template v-else>
        <Volume
            v-for="(vol, index) in volumes"
            :volume="vol"
            :index="index"
            v-slot="slotProps"
            :has-slot="hasSlot"
        >
            <slot :chapter="slotProps.chapter" :volume="vol" :index="index" />
        </Volume>
    </template>
</main>
</template>

<script setup lang="ts">
import { type MangaVolumes, ChapterOrderBy, type booleanish, type MbManga } from '~/models';

const props = defineProps<{
    sort?: ChapterOrderBy;
    asc?: boolean;
    manga: MbManga;
    volumes: MangaVolumes;
    reloading?: boolean;
    hasSlot?: booleanish;
}>();

const actSort = computed(() => props.sort ?? ChapterOrderBy.Ordinal);
const actAsc = computed(() => props.asc ?? true);

const volumes = computed(() => props.volumes?.volumes ?? []);
const allCollapsed = computed(() => !!volumes.value.find(t => !t.collapse));

const sorts : { key: ChapterOrderBy, icon: string }[] = [
    { key: ChapterOrderBy.Ordinal, icon: 'list' },
    { key: ChapterOrderBy.Date, icon: 'calendar_month' },
    { key: ChapterOrderBy.Language, icon: 'translate' },
    { key: ChapterOrderBy.Title, icon: 'sort_by_alpha' },
    { key: ChapterOrderBy.Read, icon: 'done_all' }
];

const url = (s?: ChapterOrderBy, a?: boolean) => {
    return `/manga/${props.manga?.id}?sort=${s ?? actSort.value}&asc=${a ?? actAsc.value}`;
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
            margin: auto 10px;
        }
    }
}
</style>
