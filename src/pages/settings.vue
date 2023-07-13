<template>
    <div class="max-width">
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
                            <option v-for="style in PROGRESS_BAR_STYLES" :value="style">
                                {{ style }}
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
                            <option v-for="style in PAGE_STYLES" :value="style">
                                {{ style }}
                            </option>
                        </SelectBox>
                    </div>
                    <div class="control">
                        <label class="no-bot">Image Filter</label>
                        <SelectBox v-model="filter">
                            <option v-for="style in FILTER_STYLES" :value="style">
                                {{ style }}
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
                            <option v-for="style in LIST_STYLES" :value="style">
                                {{ style }}
                            </option>
                        </SelectBox>
                    </div>
                    <div class="control checkbox">
                        <CheckBox v-model="fillPage">
                            Fill Card-List Page
                        </CheckBox>
                    </div>
                </div>
            </Tab>
            <Tab title="Theme" icon="palette" scrollable keep-alive>
                <ClientOnly>
                    <ThemeEditor />
                </ClientOnly>
            </Tab>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import {
    PROGRESS_BAR_STYLES,
    PAGE_STYLES,
    FILTER_STYLES,
    FilterStyle,
    LIST_STYLES
} from '~/models';

const {
    blurPornCovers,

    invertControls,
    forwardOnly,
    brightness,
    scrollAmount,
    pageStyle,
    progressBarStyle: progressBar,
    listStyle,
    showTutorial,
    fillPage,
    filterStyle: filter,
    customFilter,
} = useAppSettings();

useHead({ title: 'Configure the reader your way.' });
</script>

<style lang="scss" scoped>
@media only screen and (max-width: 600px) {
    .grid {
        display: flex;
        flex-flow: column;
    }
}
</style>