<template>
    <Error v-if="error" :message="error" />
    <div v-else class="max-width flex">
        <Tabs>
            <Tab title="Image Index Queue">
                <div class="flex row">
                    <h1 class="margin-top center-horz">Image Index Queue</h1>
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
                    <p class="mute margin-top center-horz">This is the number of images left in the queue to index for the Reverse Image Search Database</p>
                </div>
            </Tab>
            <Tab v-for="period of periodCharts" :title="period.period">
                <div class="flex row">
                    <h3 class="margin-top center-horz">Database Stats from the last {{ period.period }}</h3>
                    <div class="flex margin-top" style="max-width: 100%; width: 90vw;">
                        <Bar :data="period.set" :options="{
                            responsive: true,
                            maintainAspectRatio: true,
                            scales: {
                                y: { ticks: { color: color } },
                                x: { ticks: { color: color } }
                            }
                        }" />
                    </div>
                    <p class="mute margin-top center-horz">
                        This is the number of items created in the database from the last {{ period.period }}
                    </p>
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

const stats = ref<Stats>();
const error = ref<string>();
const loading = ref(false);
const interval = ref<any>();

const primaryColor = computed(() => getComputedStyle(document.body).getPropertyValue('--color-primary'));
const color = computed(() => getComputedStyle(document.body).getPropertyValue('--color'));

const imageIndexQueue = computed(() => formatLine(
    stats.value?.queue.toSorted((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) ?? [],
    t => formatDate(t.timestamp),
    [
        {
            label: 'Images In Queue',
            func: (i) => i.images,
            options: {
                backgroundColor: primaryColor.value,
                borderColor: primaryColor.value,
            }
        }
    ])
);

const periodCharts = computed(() => {
    if (!stats.value) return [];

    const periodLabels = [...new Set(stats.value.database.map(t => t.period))]
        .toSorted((a, b) => {
            const aStart = stats.value!.database
                .filter(t => t.period === a)
                .toSorted((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0]!;
            const bStart =  stats.value!.database
                .filter(t => t.period === b)
                .toSorted((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0]!;
            return new Date(aStart.start).getTime() - new Date(bStart.start).getTime();
        });

    const periods = [];
    for(const label of periodLabels) {
        const items = stats.value.database.filter(t => t.period === label)
            .toSorted((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        periods.push({
            period: label,
            set: formatLine(
                items,
                t => formatDate(t.start),
                [
                    {
                        label: 'Manga',
                        property: 'manga'
                    }, {
                        label: 'Chapters',
                        property: 'chapters'
                    }, {
                        label: 'Images',
                        property: 'images'
                    }, {
                        label: 'Authors / Artists',
                        property: 'people',
                    }, {
                        label: 'Manga Sources',
                        property: 'sources',
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

function formatDate(date: Date | string, format: string = 'R') {
    date = typeof date === 'string' ? new Date(date) : date;
    const dt = DateTime.fromJSDate(date);
    if (format === 'r' || format === 'R') return dt.toRelative({
        style: 'short'
    })!;

    let formats: { [key: string]: any } = {
        't': DateTime.TIME_24_SIMPLE,
        'T': DateTime.TIME_24_WITH_SECONDS,
        'd': DateTime.DATE_SHORT,
        'D': DateTime.DATE_MED_WITH_WEEKDAY,
        'f': DateTime.DATETIME_MED,
        'F': DateTime.DATETIME_FULL
    };

    let fo = formats[format];
    return fo ? dt.toLocaleString(fo)! : dt.toFormat(format)!;
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
