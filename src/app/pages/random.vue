<template>
<CardList
    :title="title"
    :manga="manga"
    :pending="pending"
    allowReload
    @reload="() => reload()"
    :content-ratings="contentRatings"
>
    <template #extra-buttons>
        <IconBtn
            link="/manga/random"
            title="I'm feeling lucky"
            icon="shuffle"
        />
    </template>
</CardList>
</template>

<script setup lang="ts">
import { MangaOrderBy } from '~/models';

const api = useMangaApi();
const cache = useCacheHelper();

const messages = [
    'Here to find your next binge?',
    'Here are some manga you might enjoy!',
    'Who needs sleep? Just read more!',
    'Dragon girls are best girls.',
    'Who is your favourite waifu?',
    'This site is written in Vue & Nuxt!',
    'So many times, it happened so fast.',
    'Testing testing, 1 2 3!',
    'No.',
    'I aM aToMiC!',
    '3 am babblings make the best quotes.',
    'Browse over 30,000 titles!'
];

const title = ref(messages[0]!);

useHead({ title: 'Find your next binge!' });
if (import.meta.server) {
    useSeoMeta({
        title: 'Find your next binge!',
        ogTitle: 'Find your next binge!',
        description: 'Find your next binge on MangaBox!',
        ogDescription: 'Find your next binge on MangaBox!',
        ogImage: 'https://mangabox.app/logo.png'
    });
}

const { data: cached } = useAsyncData(async () => await cache.get());
const contentRatings = computed(() => cached.value?.contentRatings ?? []);

const { data, pending, refresh } = api.nuxt.manga.search({
    size: 10,
    order: MangaOrderBy.Random
});
const manga = computed(() => data.value?.type === 'paged' ?  data.value?.data : []);
const rndNum = (max: number, min: number = 0) => min + Math.floor(Math.random() * max);
const rnd = <T>(array: T[]) => array[rndNum(array.length)]!;
const timeout = () => rndNum(10, 75);

const sleep = (timeout: number) =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));

const unprint = async () => {
    while(title.value.length !== 0) {
        title.value = title.value.substring(0, title.value.length - 1);
        await sleep(timeout());
    }
}

const printMessage = async () => {
    await unprint();
    const message = rnd(messages);

    for(let i = 0; i < message.length; i++) {
        title.value += message[i]!;
        await sleep(timeout());
    }
};

let mounted = false;

const reload = () => {
    pending.value = true;

    refresh();
}

onMounted(() => nextTick(async () => {
    mounted = true;

    while(mounted) {
        await printMessage();
        await sleep(rndNum(500, 1000));
    }
}));

onUnmounted(() => {
    mounted = false;
});
</script>
