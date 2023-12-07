<template>
    <div class="reader-selector flex row">
        <Loading v-if="loading" />
        <template v-else>
            <div class="control no-top" v-if="volumes.length > 1">
                <SelectBox v-model="volumeIndex">
                    <option
                        v-for="(vol, ind) in volumes"
                        :value="ind"
                    >
                        Volume {{ vol.name ?? (ind + 1) }} ({{ vol.chapters.length }} Chapters)
                    </option>
                </SelectBox>
            </div>
            <div class="control no-top" v-if="chapters.length > 1">
                <SelectBox v-model="chapterIndex">
                    <option
                        v-for="chap in displayChapters"
                        :value="chap.index"
                    >
                        Ch. {{ chap.version?.ordinal ?? (chap.index + 1) }} - {{ chap.version?.title ?? (chap.index + 1) }}
                    </option>
                </SelectBox>
            </div>
            <div class="control no-top" v-if="versions.length > 1">
                <SelectBox v-model="versionIndex">
                    <option
                        v-for="(ver, ind) in displayVersions"
                        :value="ind"
                    >
                        Ver. {{ ind + 1 }} - [Grp: {{ ver.group }}] - {{ ver.title }}
                    </option>
                </SelectBox>
            </div>
            <div class="control no-top" v-if="pages.length > 1">
                <SelectBox v-model="pageIndex">
                    <option
                        v-for="(_, ind) in pages"
                        :value="ind"
                    >
                        Page #{{ ind + 1 }}
                    </option>
                </SelectBox>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const { data, doMask, determineBestVersion, retrigger } = useReaderHelper();

defineProps<{ loading: boolean; }>();

const _volumeIndex = ref<number>();
const _chapterIndex = ref<number>();
const _versionIndex = ref<number>();
const _pageIndex = ref<number>();

const pageIndex = computed({
    get: () => _pageIndex.value ?? 0,
    set: (value) => {
        if (!data.value) return;

        const volume = data.value.volumed.volumes[_volumeIndex.value ?? 0];
        const chapter = volume.chapters[_chapterIndex.value ?? 0];
        const version = chapter.versions[_versionIndex.value ?? 0];
        const link = doMask(data.value?.mangaId, version.id, value);
        if (!link) return;

        navigateTo(link);
    }
});

const versionIndex = computed({
    get: () => _versionIndex.value ?? 0,
    set: (value) => {
        if (value === _versionIndex.value || !data.value) return;

        _versionIndex.value = value;
        pageIndex.value = 0;
    }
});

const chapterIndex = computed({
    get: () => _chapterIndex.value ?? 0,
    set: (value) => {
        if (value === _chapterIndex.value || !data.value) return;

        _chapterIndex.value = value;
        const volume = data.value.volumed.volumes[_volumeIndex.value ?? 0];
        const chapter = volume.chapters[value];
        const version = determineBestVersion(data.value, chapter);
        if (!version) return;

        versionIndex.value = chapter.versions.indexOf(version);
    }
});

const volumeIndex = computed({
    get: () => _volumeIndex.value ?? 0,
    set: (value) => {
        if (value === _volumeIndex.value) return;

        _volumeIndex.value = value;
        chapterIndex.value = 0;
    }
});

const volumes = computed(() => data.value?.volumed.volumes ?? []);
const chapters = computed(() => volumes.value[volumeIndex.value]?.chapters ?? []);
const versions = computed(() => chapters.value[chapterIndex.value]?.versions ?? []);
const pages = computed(() => versions.value[versionIndex.value]?.pages ?? []);

const displayVersions = computed(() => versions.value.map((v, i) => {
    const group = v.attributes.find(t => t.name === 'Scanlation Group')?.value ?? 'Unknown';
    return {
        ...v,
        index: i,
        group
    };
}));
const displayChapters = computed(() => chapters.value.map((c, i) => {
    const version = determineBestVersion(data.value!, c);
    return {
        ...c,
        version,
        index: i
    };
}));

const marry = () => {
    if (!data.value) {
        _volumeIndex.value = undefined;
        _chapterIndex.value = undefined;
        _versionIndex.value = undefined;
        _pageIndex.value = undefined;
        return;
    }

    _volumeIndex.value = data.value.volumeIndex;
    _chapterIndex.value = data.value.chapterIndex;
    _versionIndex.value = data.value.versionIndex;
    _pageIndex.value = data.value.pageIndex;
};

watch(() => retrigger.value, () => marry(), { immediate: true });
</script>

<style scoped lang="scss">

</style>
