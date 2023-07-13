<template>
<div class="theme-editor fill-parent flex row">
    <div class="background-image rounded" :style="styles"></div>

    <header>
        <div class="control">
            <label>Themes</label>
            <SelectBox v-model="themeName">
                <option v-for="theme of themes" :value="theme.name">{{ theme.name }}</option>
            </SelectBox>
        </div>
    </header>
    <main class="fill">
        <Tabs>
            <Tab icon="brush" title="Colors" scrollable keep-alive>
                <div class="settings pad rounded">
                    <ColorPicker
                        v-for="color of colors"
                        v-model="current.colorMods[color.key]"
                        :label="color.key + ' - ' + color.desc"
                        :default="color.value"
                    />
                </div>
            </Tab>
            <Tab icon="image" title="Background" scrollable keep-alive>
                <div class="settings pad rounded grid">
                    <div class="control">
                        <label>Background Type</label>
                        <SelectBox v-model="current.type">
                            <option v-for="themeType of types" :value="themeType.value">{{ themeType.name }}</option>
                        </SelectBox>
                    </div>

                    <template v-if="current.type === 'solid-color'">
                        <ColorPicker v-model="current.solidColor" label="Color" no-move more-classes="span" />
                    </template>

                    <template v-else-if="current.type === 'gradient'">
                        <div class="control">
                            <label>Gradient Direction</label>
                            <SelectBox v-model="current.gradient.dir">
                                <option v-for="dir in directions" :value="dir">
                                    {{ dir }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control" v-if="current.gradient.dir === 'deg'">
                            <label>Gradient Radius</label>
                            <input type="number" v-model="current.gradient.degrees" max="360" min="-360" step="10" />
                        </div>
                        <div class="flex center-items header span">
                            <h2 class="fill">Colors</h2>
                            <button @click="() => newColor({ color: '#fff' })">
                                <Icon>add</Icon>
                            </button>
                        </div>
                        <draggable v-model="current.gradient.colors" item-key="color" tag="div"
                            :component-data="{ class: 'span' }">
                            <template #item="{ element: color, index }">
                                <ColorPicker v-model="color.color" :label="'Gradient Color #' + (index + 1)"
                                    @delete="() => deleteColor(index)" @move="(inc) => moveColor(index, inc)" />
                            </template>
                        </draggable>
                    </template>

                    <template v-else-if="current.type === 'image'">
                        <div class="control">
                            <label>Image URL</label>
                            <input type="url" v-model="current.image.url" />
                        </div>
                        <div class="control">
                            <label>Image Position</label>
                            <SelectBox v-model="current.image.position">
                                <option v-for="pos of imagePositions" :value="pos">
                                    {{ pos }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control" v-if="current.image.position === 'custom'">
                            <label>Custom Image Position</label>
                            <input type="text" v-model="current.image.custonPosition" />
                        </div>
                        <div class="control">
                            <label>Image Repeat</label>
                            <SelectBox v-model="current.image.repeat">
                                <option v-for="repeat of imageRepeats" :value="repeat">
                                    {{ repeat }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control">
                            <label>Image Size</label>
                            <SelectBox v-model="current.image.size">
                                <option v-for="size of imageSizes" :value="size">
                                    {{ size }}
                                </option>
                            </SelectBox>
                        </div>
                        <div class="control" v-if="current.image.size === 'custom'">
                            <label>Custom Image Size</label>
                            <input type="text" v-model="current.image.customSize" />
                        </div>

                        <div class="flex center-items header span">
                            <h2 class="fill">Image Filters</h2>
                            <button @click="() => newFilter({ key: 'blur', value: '1px' })">
                                <Icon>add</Icon>
                            </button>
                        </div>

                        <draggable v-model="current.image.filters" item-key="key" tag="div"
                            :component-data="{ class: 'span' }">
                            <template #item="{ element: filter, index }">
                                <div class="control rounded pad bg-accent filter-editor">
                                    <label>Filter: #{{ index + 1 }}</label>
                                    <div class="group">
                                        <SelectBox v-model="filter.key">
                                            <option v-for="filterType of availableTypes" :value="filterType.key">
                                                {{ filterType.key }}
                                            </option>
                                        </SelectBox>

                                        <input :type="config(filter.key).type === 'text' ? 'text' : 'number'"
                                            :min="config(filter.key).min" :max="config(filter.key).max"
                                            :step="config(filter.key).step" :value="strip(filter.key, filter.value)"
                                            @input="($event) => filterInput($event, filter)" class="fill" />

                                        <label v-if="config(filter.key).unit">
                                            {{ config(filter.key).unit }}&nbsp;
                                            <span v-if="hint(filter.key)">({{ hint(filter.key) }})</span>
                                        </label>

                                        <button @click="() => deleteFilter(index)">
                                            <Icon>delete</Icon>
                                        </button>
                                        <button @click="() => moveFilter(index, -1)">
                                            <Icon>arrow_upward</Icon>
                                        </button>
                                        <button @click="() => moveFilter(index, 1)">
                                            <Icon>arrow_downward</Icon>
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </draggable>
                    </template>
                </div>
            </Tab>
        </Tabs>
    </main>

    <footer class="flex">
        <IconBtn pad-left @click="save" icon="save" />
        <IconBtn @click="reset" icon="sync" />
    </footer>
</div>
</template>

<script setup lang="ts">
import { FilterProp, ThemeFilter, THEME_DEFAULTS } from '~/models';
type Dic = { [key: string]: string };

const {
    clone
} = useApiHelper();

const {
    background,
    determineStyle,
    resetBgImage,
    fixBgImage,
    setBgImage
} = useAppSettings();

const {
    availableTypes,
    directions,
    imagePositions,
    imageRepeats,
    imageSizes,
    themes,
    styleMap,
    types,
    colors
} = THEME_DEFAULTS;
const current = reactive(clone(background.value));
const themeName = computed<string>({
    get: () => current.name,
    set: (value: string) => {
        if (current.name === value) return;

        const nextTheme = themes.find(t => t.name === value);
        const theme = clone(nextTheme || themes[0]);
        Object.assign(current, theme);
    }
});

const styles = computed(() => {
    const map: Dic = {};
    const style = <Dic>determineStyle(current);

    for (let key in styleMap) {
        map[styleMap[key]] = style[key];
    }

    setBgImage(current);
    return map;
});

const arrayFuns = <T>(target: () => Array<T>) => {
    const mov = (index: number, increment: number) => {
        const array = target();
        let next = (index + increment + array.length) % array.length;
        if (next === index) return;
        [array[index], array[next]] = [array[next], array[index]];
    };

    const del = (index: number) => { target().splice(index, 1); }
    const add = (value: T) => { target().push(value); }

    return { mov, del, add }
}

const {
    mov: moveFilter,
    del: deleteFilter,
    add: newFilter
} = arrayFuns(() => current.image.filters);

const {
    mov: moveColor,
    del: deleteColor,
    add: newColor
} = arrayFuns(() => current.gradient.colors);

const save = () => { background.value = clone(current); };

const reset = () => { resetBgImage(); };

const config = (key: FilterProp) => availableTypes.find(t => t.key === key) ?? availableTypes[0];

const hint = (key: FilterProp) => {
    const conf = config(key);
    if (conf.type === 'text' ||
        (conf.min === undefined && conf.max === undefined)) return '';

    if (conf.min === undefined) return `<= ${conf.max}`;
    if (conf.max === undefined) return `${conf.min}+`;

    return `${conf.min} - ${conf.max}`;
}

const strip = (key: FilterProp, value: string) => {
    return config(key).type === 'text' ? value : value.replace(/[^\d.-]/g, '');
}

const filterInput = ($event: Event, filter: ThemeFilter) => {
    filter.value = ($event.target as HTMLInputElement)?.value + config(filter.key).unit
};

onUnmounted(() => fixBgImage());
</script>

<style lang="scss" scoped>
.theme-editor {
    display: flex;
    flex-flow: column;
    overflow: hidden;
}

.settings {
    position: relative;

    h2:not(:first-child),
    .header,
    footer {
        margin-top: var(--margin);
    }

    .filter-editor {
        select {
            min-width: 80px;
        }
    }

    footer {
        button:not(:first-child) {
            margin-left: 5px;
        }
    }
}

@media only screen and (max-width: 600px) {
    .grid {
        display: flex;
        flex-flow: column;
    }
}
</style>