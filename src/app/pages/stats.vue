<template>
    <Error v-if="error" :message="error" />
    <div v-else class="max-width flex">
        <Tabs>
            <Tab title="Image Index Queue">
                <h1>Image Index Queue</h1>
                <div class="flex margin-top" style="max-width: 100%; width: 90vw;">
                    <Line :data="imageIndexQueue" :options="{
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: { ticks: { color: color } },
                            x: { ticks: { color: color } }
                        }
                    }" />
                </div>
                <p class="mute margin-bottom">This is the number of images left in the queue to index for the Reverse Image Search Database</p>
            </Tab>
            <Tab v-for="period of periodCharts" :title="period.period">
                <div class="flex row">
                    <h3 class="margin-top center-horz" v-if="period.period === 'All Time'">Database Stats since the beginning</h3>
                    <h3 class="margin-top center-horz" v-else>Database Stats from the last {{ period.period }}</h3>
                    <div class="flex margin-top" style="max-width: 100%; width: 90vw;">
                        <Line :data="period.set" :options="{
                            responsive: true,
                            maintainAspectRatio: true,
                            scales: {
                                y: { ticks: { color: color } },
                                x: { ticks: { color: color } }
                            }
                        }" />
                    </div>
                    <p
                        v-if="period.period !== 'All Time'"
                        class="mute margin-top center-horz"
                    >This is the total number of entities loaded into the database in the last {{ period.period }}.</p>
                </div>
            </Tab>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon';
import type { Stats } from '~/models';


const api = useMangaApi();
const { formatLine } = useChartHelper();

const stats = ref<Stats[]>([]);
const error = ref<string>();
const loading = ref(false);
const interval = ref<any>();

const primaryColor = computed(() => getComputedStyle(document.body).getPropertyValue('--color-primary'));
const color = computed(() => getComputedStyle(document.body).getPropertyValue('--color'));

const sorted = computed(() => stats.value.toSorted((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));

const imageIndexQueue = computed(() => formatLine(
    sorted.value.slice(-10),
    t => formatDate(t.timestamp),
    [
        {
            label: 'Images In Queue',
            func: (i) => i.queue.images,
            options: {
                backgroundColor: primaryColor.value,
                borderColor: primaryColor.value,
            }
        }
    ])
);

const periodCharts = computed(() => {
    if (sorted.value.length === 0) return [];

    const periodLabels = sorted.value[0]!.database.map(t => t.period);

    const periods = [];
    for(const label of periodLabels) {
        const func = (i: Stats) => i.database.filter(t => t.period === label)[0]!;
        periods.push({
            period: label,
            set: formatLine(
                sorted.value.slice(-10),
                t => formatDate(t.timestamp),
                [
                    {
                        label: 'Manga',
                        func: (i) => func(i).manga,
                    }, {
                        label: 'Chapters',
                        func: (i) => func(i).chapters,
                    }, {
                        label: 'Images',
                        func: (i) => func(i).images,
                    }, {
                        label: 'Authors / Artists',
                        func: (i) => func(i).people,
                    }, {
                        label: 'Manga Sources',
                        func: (i) => func(i).sources,
                    }
                ])
        })
    }
    return periods;
});

const refreshStats = async () => {
    loading.value = true;
    const result = await api.promise.metaData.stats();
    loading.value = false;
    if (!api.isSuccess(result)) {
        error.value = api.errorMessage(result);
        return;
    }

    stats.value = api.data(result) ?? [];
}

function formatDate(date: Date | string) {
    date = typeof date === 'string' ? new Date(date) : date;
    const dt = DateTime.fromJSDate(date);
    return dt.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
}

onMounted(() => {
    refreshStats();
    interval.value ??= setInterval(() => refreshStats(), 30 * 1000);
});

onUnmounted(() => {
    if (interval.value)
        clearInterval(interval.value);
});
</script>
