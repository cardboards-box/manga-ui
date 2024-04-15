<template>
    <NuxtLink
        v-if="link && !isTrue(external)"
        :to="!isTrue(isDisabled) ? link : undefined"
        :active-class="active"
        class="btn"
        :class="classes"
        @click="() => $emit('click')"
        :style="styles"
        :title="title || text"
    >
        <Icon
            v-if="icon"
            :size="acIconSize"
            :fill="isTrue(fill)"
            :spin="isTrue(isSpinning)"
            :rotate="rotate"
            :unsize="acUnsize"
            :speed="speed"
            :flip="isTrue(flip)"
        >
            <slot />{{ icon }}
        </Icon>
        <p v-if="text">{{ text }}</p>
        <div class="alert-icon flex" v-if="hasAlert">
            <Icon v-if="alertIcon" class="center" size="20px" unsize icon-size="20px">{{ alertIcon }}</Icon>
            <span v-else class="center">{{ alertText }}</span>
        </div>
    </NuxtLink>
    <a
        v-else-if="link"
        target="_blank"
        :href="!isTrue(isDisabled) ? link : undefined"
        class="btn"
        :class="classes"
        @click="() => $emit('click')"
        :style="styles"
        :title="title || text"
    >
        <Icon
            v-if="icon"
            :size="acIconSize"
            :fill="isTrue(fill)"
            :spin="isTrue(isSpinning)"
            :rotate="rotate"
            :unsize="acUnsize"
            :speed="speed"
            :flip="isTrue(flip)"
        >
            <slot />{{ icon }}
        </Icon>
        <p v-if="text">{{ text }}</p>
        <div class="alert-icon flex" v-if="hasAlert">
            <Icon v-if="alertIcon" class="center" size="20px" unsize icon-size="20px">{{ alertIcon }}</Icon>
            <span v-else class="center">{{ alertText }}</span>
        </div>
    </a>
    <button
        v-else class="btn"
        :class="classes"
        @click="() => $emit('click')"
        :style="styles"
        :disabled="isDisabled"
        :title="title || text"
    >
        <Icon
            v-if="icon"
            :size="acIconSize"
            :fill="isTrue(fill)"
            :spin="isTrue(isSpinning)"
            :rotate="rotate"
            :unsize="acUnsize"
            :speed="speed"
            :flip="isTrue(flip)"
        >
            <slot />{{ icon }}
        </Icon>
        <p v-if="text">{{ text }}</p>
        <div class="alert-icon flex" v-if="hasAlert">
            <Icon v-if="alertIcon" class="center" size="20px" unsize icon-size="20px">{{ alertIcon }}</Icon>
            <span v-else class="center">{{ alertText }}</span>
        </div>
    </button>
</template>

<script setup lang="ts">
import type { booleanish, ClassOptions } from '~/models';

const { serClasses, isTrue } = useUtils();

const props = withDefaults(defineProps<{
    text?: string;
    icon?: string;
    color?: 'primary' | 'secondary' | 'danger' | 'warning' | 'shade' | 'inline' | 'success';
    fill?: booleanish;
    spin?: booleanish;
    size?: string;
    iconSize?: string;
    speed?: string;
    rotate?: number;
    unsize?: booleanish;
    link?: string;
    external?: booleanish;
    active?: string;
    disabled?: booleanish;
    padLeft?: booleanish;
    breakpoint?: booleanish;
    invertBreakpoint?: booleanish;
    loading?: booleanish;
    inline?: booleanish;
    otherClasses?: ClassOptions;
    'class'?: ClassOptions;
    flip?: booleanish;
    noBoarder?: booleanish;
    title?: string;

    alertText?: string;
    alertIcon?: string;
}>(), {
    size: '1rem',
    icon: 'home',
    iconSize: '24px'
});

defineEmits<{
    (e: 'click'): void
}>();

const isSpinning = computed(() => isTrue(props.spin) || isTrue(props.loading));
const isDisabled = computed(() => isTrue(props.disabled) || isTrue(props.loading));
const acIconSize = computed(() => props.iconSize);
const acUnsize = computed(() => isTrue(props.inline) || isTrue(props.unsize));
const acColor = computed(() => (props.inline ? 'inline' : props.color) ?? '');

const hasAlert = computed(() => !!props.alertText || !!props.alertIcon);

const classes = computed(() => serClasses(
    {
        'inline': isTrue(props.inline),
        'no-text': !props.text,
        'has-text': !!props.text,
        'disabled': isDisabled.value,
        'pad-left': isTrue(props.padLeft),
        'breakpoint': isTrue(props.breakpoint),
        'invert-breakpoint': isTrue(props.invertBreakpoint),
        'no-boarder': isTrue(props.noBoarder),
    },
    [ acColor.value ],
    props.class,
    props.otherClasses
));

const styles = computed(() => {
    const styles: { [key: string]: string } = {
        'font-size': props.size
    };

    if (!props.link) styles['--icon-size'] = props.iconSize;

    return styles;
});
</script>

<style lang="scss" scoped>
$icon-padding: 10px;
$icon-height: calc(var(--icon-size) + #{$icon-padding * 2} + 2px);

.btn {
    background-color: transparent;
    border: 1px solid transparent;
    display: inline-flex;
    flex-flow: row;
    align-items: center;
    border-radius: var(--brd-radius);
    padding: 5px;
    height: auto;
    position: relative;

    p {
        margin-left: 5px;
        margin-right: 5px;
        white-space: nowrap;
    }

    .alert-icon {
        position: absolute;
        top: 50%;
        left: 20px;
        background-color: var(--color-warning);
        border-radius: 50%;
        min-width: 20px;
        min-height: 20px;
        font-size: 12px;
        padding: 2px;
    }

    &.no-text {
        padding: $icon-padding;
        height: $icon-height;
    }

    &.has-text {
        padding: 5px 10px;
    }

    &.primary,
    &.secondary,
    &.danger,
    &.warning,
    &.shade,
    &.success {
        border-color: var(--bg-color-accent);
        background-color: var(--color-primary);
    }

    &.secondary {
        background-color: var(--color-secondary);
    }

    &.danger {
        background-color: var(--color-warning);
    }

    &.warning {
        background-color: var(--color-actual-warning);
    }

    &.success {
        background-color: var(--bg-color-accent);
    }

    &.shade {
        background-color: var(--bg-color-accent);
        border-color: transparent;
    }

    &.inline {
        background-color: transparent;
        margin: 0;
        padding: 0;
    }

    &:hover:not(.disabled) {
        cursor: pointer;

        &:not(.inline) {
            background-color: var(--bg-color-accent);
        }

        &.shade {
            background-color: var(--bg-color-accent-dark);
        }
    }

    &.breakpoint {
        padding: $icon-padding;
        height: $icon-height;

        p {
            display: none;
            margin: 0;
        }
    }

    &.active,
    &.router-link-exact-active,
    &.router-link-active {
        border-color: var(--color-primary);
    }

    &.no-boarder {
        border: none !important;
    }
}

@media only screen and (max-width: 600px) {
    .invert-breakpoint.has-text {
        padding: 5px;
        p { display: none; }
    }
}

@media only screen and (max-width: 400px) {
    .breakpoint.has-text {
        flex: 1;
        padding: 5px 10px;
        height: unset;

        p {
            display: block;
            margin-left: 5px;
            margin-right: 5px;
        }
    }
}
</style>
