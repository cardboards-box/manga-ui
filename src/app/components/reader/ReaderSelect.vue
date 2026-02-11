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
                        {{ vol.name }}
                    </option>
                </SelectBox>
            </div>
            <div class="control no-top" v-if="chapters.length > 1">
                <SelectBox v-model="chapterIndex">
                    <option
                        v-for="chap in chapters"
                        :value="chap.index"
                    >
                        {{ chap.name }}
                    </option>
                </SelectBox>
            </div>
            <div class="control no-top" v-if="versions.length > 1">
                <SelectBox v-model="versionIndex">
                    <option
                        v-for="ver in versions"
                        :value="ver.index"
                    >
                        {{ ver.name }}
                    </option>
                </SelectBox>
            </div>
            <div class="control no-top" v-if="pages.length > 1">
                <SelectBox v-model="pageIndex">
                    <option
                        v-for="page in pages"
                        :value="page.index"
                    >
                        {{ page.name }}
                    </option>
                </SelectBox>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const { selectLinks } = useReaderHelper();

defineProps<{ loading: boolean; }>();

const pageIndex = computed({
    get: () => selectLinks.value.page.find(t => t.current)?.index ?? 0,
    set: (value) => {
        const selected = selectLinks.value.page.find(p => p.index === value);
        if (!selected) return;

        navigateTo(selected.url);
    }
});

const versionIndex = computed({
    get: () => selectLinks.value.versions.find(t => t.current)?.index ?? 0,
    set: (value) => {
        const selected = selectLinks.value.versions.find(p => p.index === value);
        if (!selected) return;

        navigateTo(selected.url);
    }
});

const chapterIndex = computed({
    get: () => selectLinks.value.chapter.find(t => t.current)?.index ?? 0,
    set: (value) => {
        const selected = selectLinks.value.chapter.find(p => p.index === value);
        if (!selected) return;

        navigateTo(selected.url);
    }
});

const volumeIndex = computed({
    get: () => selectLinks.value.volume.find(t => t.current)?.index ?? 0,
    set: (value) => {
        const selected = selectLinks.value.volume.find(p => p.index === value);
        if (!selected) return;

        navigateTo(selected.url);
    }
});

const volumes = computed(() => selectLinks.value.volume);
const chapters = computed(() => selectLinks.value.chapter);
const versions = computed(() => selectLinks.value.versions);
const pages = computed(() => selectLinks.value.page);
</script>

<style scoped lang="scss">

</style>
