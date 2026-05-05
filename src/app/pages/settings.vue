<template>
    <div class="max-width">
        <ClientOnly>
            <Tabs>
                <Tab title="Settings" icon="settings" scrollable keep-alive>
                    <div class="grid">
                        <div class="control checkbox">
                            <CheckBox v-model="blurPornCovers">
                                Blur Pornographic Cover Art
                            </CheckBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="invertControls">
                                Invert Page Direction Controls
                            </CheckBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="forwardOnly">
                                No Directional Buttons
                            </CheckBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="showTutorial">
                                Show Page Tutorial
                            </CheckBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Progress Bar Style</label>
                            <SelectBox v-model="progressBar">
                                <option v-for="style in PROGRESS_BAR_STYLES" :value="style.value">
                                    {{ style.name }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Scroll amount on key event</label>
                            <input type="number" min="0" max="1000" step="10" v-model="scrollAmount" />
                        </div>
                        <div class="control">
                            <label class="no-bot">Image Style</label>
                            <SelectBox v-model="pageStyle">
                                <option v-for="style in PAGE_STYLES" :value="style.value">
                                    {{ style.name }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control checkbox">
                            <CheckBox v-model="autoLongStrip">
                                Switch to Long-Strip Style Automatically
                            </CheckBox>
                        </div>
                        <div class="control">
                            <label class="no-bot">Auto Long-Strip Image Style</label>
                            <SelectBox v-model="autoLongStripStyle">
                                <option v-for="style in PAGE_STYLES_LONGSTRIP" :value="style.value">
                                    {{ style.name }}
                                </option>
                            </SelectBox>
                        </div>
                        <template
                            v-if="
                                [PageStyle.SinglePageMaxSize, PageStyle.LongStripMaxSize].includes(pageStyle) ||
                                (autoLongStrip && PageStyle.LongStripMaxSize === autoLongStripStyle)
                            "
                        >
                            <div class="control">
                                <label class="no-bot">Image Width (px)</label>
                                <label class="no-bot mute">0 disables max width</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5000"
                                    step="50"
                                    v-model="maxImageWidth"
                                />
                            </div>
                            <div class="control">
                                <label class="no-bot">Image Height (px)</label>
                                <label class="no-bot mute">0 disables max height</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5000"
                                    step="50"
                                    v-model="maxImageHeight"
                                />
                            </div>
                        </template>
                        <div class="control">
                            <label class="no-bot">Image Filter</label>
                            <SelectBox v-model="filter">
                                <option v-for="style in FILTER_STYLES" :value="style.value">
                                    {{ style.name }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control" v-if="filter === FilterStyle.Custom">
                            <label class="no-bot">Custom Filter</label>
                            <input type="text" v-model="customFilter" placeholder="Custom CSS filter" />
                        </div>
                        <div class="control">
                            <label class="no-bot">
                                Image Brightness ({{ brightness }}%)
                            </label>
                            <input type="range" min="1" max="100" v-model="brightness" />
                        </div>
                        <div class="control">
                            <label class="no-bot">Card Style</label>
                            <SelectBox v-model="listStyle">
                                <option v-for="style in LIST_STYLES" :value="style.value">
                                    {{ style.name }}
                                </option>
                            </SelectBox>
                        </div>

                        <div class="control checkbox">
                            <CheckBox v-model="fillPage">
                                Fill Card-List Page
                            </CheckBox>
                        </div>
                        <div class="control span">
                            <label class="no-bot">Proxy URL</label>
                            <input type="text" v-model="proxyUrl" placeholder="Proxy URL (use placeholders: {image}, {group}, {referer})" />
                        </div>
                        <div class="control span">
                            <label class="no-bot">Black List Tags</label>
                            <BlackListTagsSelector v-model="blackListTags" />
                        </div>
                    </div>
                </Tab>
                <Tab title="Theme" icon="palette" scrollable keep-alive>
                    <ThemeEditor />
                </Tab>
                <Tab title="Image Cache" icon="database" scrollable keep-alive>
                    <div class="flex">
                        <h3 class="center-vert fill">Image Cache Info</h3>
                        <IconBtn
                            icon="refresh"
                            color="shade"
                            title="Refresh Cache Info"
                            @click="refreshMeta"
                        />
                    </div>
                    <div class="flex margin">
                        <span class="center-vert"><b>Total Images: </b></span>
                        <span class="margin-left center-vert">{{ meta.totalCount }}</span>
                    </div>
                    <div class="flex margin">
                        <span class="center-vert"><b>Total Covers: </b></span>
                        <span class="margin-left center-vert">{{ meta.coverCount }}</span>
                    </div>
                    <div class="flex margin">
                        <span class="center-vert"><b>Total Pages: </b></span>
                        <span class="margin-left center-vert">{{ meta.totalCount - meta.coverCount }}</span>
                    </div>
                    <div class="flex margin">
                        <span class="center-vert"><b>Total Size: </b></span>
                        <span class="margin-left center-vert">{{ fileSize }}</span>
                    </div>
                    <div class="flex margin" v-if="cacheMinDate">
                        <span class="center-vert"><b>First Cache Date: </b></span>
                        <span class="margin-left center-vert">
                            <Date :date="cacheMinDate" utc /> - <Date :date="cacheMinDate" format="R" utc />
                        </span>
                    </div>
                    <div class="flex margin" v-if="cacheMaxDate">
                        <span class="center-vert"><b>Last Cache Date: </b></span>
                        <span class="margin-left center-vert">
                            <Date :date="cacheMaxDate" utc /> - <Date :date="cacheMaxDate" format="R" utc />
                        </span>
                    </div>
                    <div class="flex">
                        <div class="fill" />
                        <IconBtn
                            icon="delete"
                            color="primary"
                            text="Clear Page Cache"
                            title="Clears all page images from the cache, leaving covers alone"
                            @click="clear(false)"
                        />
                        <IconBtn
                            class="margin-left"
                            icon="delete"
                            color="danger"
                            text="Clear All Cache"
                            title="Clears all page images and cover images from the cache"
                            @click="clear(true)"
                        />
                    </div>
                </Tab>
            </Tabs>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import {
    PROGRESS_BAR_STYLES,
    PAGE_STYLES,
    PAGE_STYLES_LONGSTRIP,
    FILTER_STYLES,
    FilterStyle,
    LIST_STYLES,
    PageStyle
} from '~/models';

const { fileSizeMicro } = useUtils();

const {
    blurPornCovers,
    invertControls,
    forwardOnly,
    brightness,
    scrollAmount,
    pageStyle,
    autoLongStrip,
    autoLongStripStyle,
    progressBarStyle: progressBar,
    listStyle,
    showTutorial,
    fillPage,
    filterStyle: filter,
    customFilter,
    proxyUrl,
    blackListTags,
    maxImageHeight,
    maxImageWidth,
} = useAppSettings();

const {
    meta,
    refreshMeta,
    clear
} = useImageCache();

useHead({ title: 'Configure the reader your way.' });

const cacheMinDate = computed(() => meta.value.minDate ? new Date(meta.value.minDate) : null);
const cacheMaxDate = computed(() => meta.value.maxDate ? new Date(meta.value.maxDate) : null);
const fileSize = computed(() => fileSizeMicro(meta.value.storedSize));

onMounted(() => {
    refreshMeta();
});
</script>

<style lang="scss" scoped>
@media only screen and (max-width: 600px) {
    .grid {
        display: flex;
        flex-flow: column;
    }
}
</style>
