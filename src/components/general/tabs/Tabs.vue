<template>
<div class="tab-controls fill fill-parent" :class="classes">
    <div class="tab-header">
        <button
            class="tab-button"
            v-for="tab of data"
            :key="tab.id"
            @click="() => setActiveTab(tab.id)"
            :class="{ 'active': tab.active, 'dark' : tab.dark }"
        >
            <div class="title">
                <Icon v-if="tab.icon">{{ tab.icon }}</Icon>
                <p v-if="tab.title">{{ tab.title }}</p>
            </div>
        </button>
    </div>
    <div class="tab-content">
        <slot />
    </div>
</div>
</template>

<script lang="ts" setup>
import { booleanish, isTrue } from '~/models';

type Style = 'top' | 'bottom' | 'left' | 'right';

const props = withDefaults(defineProps<{ 
    position?: Style,
    noMargins?: booleanish
}>(), { position: 'top' });

const { tabs, setActiveTab } = useTabs();

const classes = computed(() => `${props.position} ${isTrue(props.noMargins) ? 'no-margins' : ''}`);

const data = computed(() => {
    const output = [];
    for(let [identifiter, tab] of tabs.entries()) {
        output.push({
            id: identifiter,
            ...tab
        });
    }
    return output;
});
</script>

<style lang="scss">
$margin: 0.75rem;
$transition: 150ms;
$background: var(--bg-color-accent);
$darkbackground: var(--bg-color);

.tab-controls {
    position: relative;
    height: auto;
    min-width: 100%;
    min-height: 100%;
    overflow: hidden;
    display: flex;
    flex-flow: column;

    .tab-header {
        display: flex;
        flex-flow: row;
        margin: #{$margin} #{$margin} 0 #{$margin};

        .tab-button {
            flex: 1;
            display: flex;
            transition: background-color #{$transition};
            border-top-left-radius: $margin;
            border-top-right-radius: $margin;

            .title {
                display: flex;
                margin: 5px auto;
                align-items: center;

                p { margin-left: 5px; }
            }

            &.active {
                background-color: $background;

                &.dark { background-color: $darkbackground; }
            }

        }
    }

    .tab-content {
        position: relative;
        flex: 1;
        overflow: hidden;
        margin: 0 #{$margin} #{$margin} #{$margin};

        .tab {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
            z-index: -1;
            transition: opacity #{$transition};
            width: 100%;
            height: 100%;
            max-height: 100%;;
            max-width: 100%;
            overflow: hidden;
            background-color: $background;
            border-radius: $margin;
            display: flex;

            &.active {
                opacity: 1;
                z-index: 0;
            }

            &.dark { background-color: $darkbackground; }
            &:first-child { border-top-left-radius: 0; }
            &:last-child { border-top-right-radius: 0; }

            .tab-panel {
                margin: $margin;
                flex: 1;
                overflow: hidden;

                &.scroll { overflow-y: auto; }
            }
        }
    }

    &.bottom {
        flex-flow: column-reverse;

        .tab-header {
            margin: 0 #{$margin} #{$margin} #{$margin};

            .tab-button {
                border-radius: $margin;
                border-top-left-radius: 0;
                border-top-right-radius: 0;
            }
        }

        .tab-content {
            margin: #{$margin} #{$margin} 0 #{$margin};

            .tab {
                border-radius: $margin;
                
                &:first-child { border-bottom-left-radius: 0; }
                &:last-child { border-bottom-right-radius: 0; }
            }
        }
    }

    &.left {
        flex-flow: row;
        .tab-content .tab { border-top-right-radius: $margin; }
        .tab-header .tab-button {
            border-top-left-radius: $margin;
            border-bottom-left-radius: $margin;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
    }

    &.right {
        flex-flow: row-reverse;
        .tab-content .tab { 
            border-top-left-radius: $margin;

            &:first-child { border-top-right-radius: 0; }
            &:last-child { border-top-right-radius: $margin; }
        }
        .tab-header .tab-button {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
            border-top-right-radius: $margin;
            border-bottom-right-radius: $margin;

            .title {
                flex-flow:  row-reverse;
                p { margin-right: 5px; }
            }
        }
    }

    &.left, &.right {
        .tab-header {
            flex-flow: column;
            margin: #{$margin} 0;
            .tab-button {
                flex: 0;
                .title { margin: 5px 0; }
            }
        }
        .tab-content { margin: #{$margin} 0; }
    }

    &.no-margins {
        .tab-header { margin: 0; }
        .tab-content { margin: 0; }
    }
}
</style>