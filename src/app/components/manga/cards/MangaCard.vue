<template>
    <Card
        :cover="manga"
        :style="actStyle"
        :title="displayTitle"
        :link="link"
        :description="manga.entity.description"
    >
        <template #title v-if="canRead">
            <Icon title="Completed" v-if="completed">check_circle</Icon>
            <Icon title="In Progress" v-if="inProgress">autorenew</Icon>
            <IconBtn
                v-if="canRead"
                inline
                :icon="favorited ? 'heart_minus' : 'favorite'"
                :title="favorited ? 'Favourited' : 'Not Favourited'"
                icon-size=""
                :loading="favLoading"
                @click="toggleFavorite"
            />
            <slot name="title" />
        </template>

        <slot />

        <CardLine v-if="progPerc !== 0" title="Progress" :style="actStyle">
            {{ progPerc.toFixed(2) }}%&nbsp;- <Date :date="actProgress?.entity.lastReadAt" utc />
        </CardLine>
        <template v-if="ext">
            <CardLine title="Latest Chapter" :style="actStyle">
                <Date :date="ext.lastChapterCreated" utc />
            </CardLine>
            <CardLine title="Stats" :style="actStyle">
                {{ ext.chapterCount }} Chapter{{ ext.chapterCount !== 1 ? 's' : '' }}
                <span v-if="ext.volumeCount > 0">&nbsp;in {{ ext.volumeCount }} Volume{{ ext.volumeCount !== 1 ? 's' : '' }}</span>
                <span v-if="ext.daysBetweenUpdates > 0">&nbsp;- Updating every {{ ext.daysBetweenUpdates.toFixed(2) }} days</span>
            </CardLine>
        </template>
        <CardLine title="Source" :style="actStyle">
            <a :href="manga.entity.url">{{ source?.name }}</a>
        </CardLine>
        <CardTags :style="actStyle">
            <CardTag
                v-if="rating"
                :nsfw="rating.value !== ContentRating.Safe"
                :link="`/search/all?ratings=` + rating.value"
            >{{ rating.name }}</CardTag>
            <CardTag
                v-for="tag of tags"
                :key="tag.id"
                :link="'/search/all?tags=' + tag.id"
            >{{ tag.name }}</CardTag>
        </CardTags>
    </Card>
</template>

<script setup lang="ts">
import { ContentRating, ListStyle } from '~/models';
import type { EnumDescription, MbTypeManga, MbTypeMangaSearch, MbTypeProgressMulti } from '~/models';

const { listStyle } = useAppSettings();
const { canRead } = useAuthHelper();
const { getRelateds, getRelated } = useMangaUtils();
const api = useMangaApi();
const progressCache = useProgressCacheHelper();

const props = defineProps<{
    manga: MbTypeManga | MbTypeMangaSearch;
    overrideStyle?: ListStyle;
    contentRatings: EnumDescription<ContentRating>[];
}>();

const _localProg = ref<MbTypeProgressMulti | undefined>();
const cache = computed(() => progressCache.cache.value[props.manga.entity.id]);
const actProgress = computed(() => _localProg.value ?? cache.value);
const favLoading = ref(false);

const tags = computed(() => getRelateds(props.manga, 'MbTag').toSorted((a, b) => a.name.localeCompare(b.name)));
const ext = computed(() => getRelated(props.manga, 'MbMangaExt'));
const source = computed(() => getRelated(props.manga, 'MbSource'));
const actStyle = computed(() => props.overrideStyle ?? listStyle.value);

const favorited = computed(() => actProgress.value?.entity.favorited);
const completed = computed(() => actProgress.value?.entity.isCompleted);
const progPerc = computed(() => actProgress.value?.entity.progressPercentage ?? 0);
const inProgress = computed(() => progPerc.value > 0 && progPerc.value < 100);
const rating = computed(() => props.contentRatings.find(t => t.value === props.manga.entity.contentRating));
const displayTitle = computed(() => ext.value?.displayTitle ?? props.manga.entity.title);

const link = computed(() => canRead.value ? `/manga/${props.manga.entity.id}` : props.manga.entity.url);

const toggleFavorite = async () => {
    if (!canRead.value || !actProgress.value) return;

    favLoading.value = true;
    const result = await (favorited.value
        ? api.promise.manga.unfavorite(props.manga.entity.id)
        : api.promise.manga.favorite(props.manga.entity.id));
    favLoading.value = false;
    if (!api.isSuccess(result)) return;

    _localProg.value = <MbTypeProgressMulti>api.data(result);
    progressCache.clear(props.manga.entity.id);
}
</script>
