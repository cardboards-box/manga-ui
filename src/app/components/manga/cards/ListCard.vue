<template>
    <Card
        :cover="image"
        :style="actStyle"
        :title="entity.name"
        :link="link"
        :description="entity.description"
    >
        <slot />
        <CardLine title="Visibility" :style="actStyle">{{ entity.isPublic ? 'Public' : 'Private' }}</CardLine>
        <CardLine title="Created" :style="actStyle">
            <Date :date="entity.createdAt" utc />,
            <b>Last Updated:</b>&nbsp;<Date :date="entity.updatedAt" utc />
        </CardLine>
        <CardLine title="Stats" :style="actStyle" v-if="ext">
            {{ ext.mangaCount ?? 0 }} Manga, Cloned {{ ext.clonedCount ?? 0 }} time{{ ext.clonedCount === 1 ? '' : 's' }}.
        </CardLine>
        <CardTags :style="actStyle">
            <CardTag
                v-for="tag of tags"
                :key="tag.id"
                :link="'/search/all?include=' + tag.id"
            >{{ tag.name }}</CardTag>
        </CardTags>
    </Card>
</template>

<script lang="ts" setup>
import type { MbTypeList, MbTypeListSearch, ListStyle } from '~/models';

const { listStyle } = useAppSettings();
const { getRelateds, getRelated } = useMangaUtils();

const props = defineProps<{
    list: MbTypeList | MbTypeListSearch;
    overrideStyle?: ListStyle;
}>();

const actStyle = computed(() => props.overrideStyle ?? listStyle.value);
const tags = computed(() => getRelateds(props.list, 'MbTag').toSorted((a, b) => a.name.localeCompare(b.name)));
const image = computed(() => getRelated(props.list, 'MbImage'));
const entity = computed(() => props.list.entity);
const link = computed(() => `/list/${entity.value.id}`);
const ext = computed(() => getRelated(props.list, 'MbListExt'));
</script>
