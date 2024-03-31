<template>
<NuxtLink
    v-if="link && !external"
    :to="!isDisabled ? link : undefined"
    :active-class="active"
    class="btn"
    :class="classes"
    @click="() => $emit('click')"
    :style="styles"
    :title="text"
>
    <Icon
        :size="acIconSize"
        :fill="fill"
        :spin="isSpinning"
        :rotate="rotate"
        :unsize="acUnsize"
        :speed="speed"
        :flip="flip"
    >
        <slot />{{ icon }}
    </Icon>
    <p v-if="text">{{ text }}</p>
</NuxtLink>
<a
    v-else-if="link"
    target="_blank"
    :href="!isDisabled ? link : undefined"
    class="btn"
    :class="classes"
    @click="() => $emit('click')"
    :style="styles"
    :title="text"
>
    <Icon
        :size="acIconSize"
        :fill="fill"
        :spin="isSpinning"
        :rotate="rotate"
        :unsize="acUnsize"
        :speed="speed"
        :flip="flip"
    >
        <slot />{{ icon }}
    </Icon>
    <p v-if="text">{{ text }}</p>
</a>
<button
    v-else
    class="btn"
    :class="classes"
    @click="() => $emit('click')"
    :style="styles"
    :disabled="isDisabled"
    :title="text"
>
    <Icon
        :size="acIconSize"
        :fill="fill"
        :spin="isSpinning"
        :rotate="rotate"
        :unsize="acUnsize"
        :speed="speed"
        :flip="flip"
    >
        <slot />{{ icon }}
    </Icon>
    <p v-if="text">{{ text }}</p>
</button>
</template>

<script setup lang="ts">
import type { ClassOptions, booleanish } from '~/models';
const { isTrue, serClasses } = useUtils();

const props = withDefaults(defineProps<{
    text?: string;
    icon?: string;
    color?: 'primary' | 'secondary' | 'danger' | 'warning' | 'shade' | 'inline';
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
    loading?: booleanish;
    inline?: booleanish;
    otherClasses?: ClassOptions;
    flip?: booleanish;
    'class'?: ClassOptions;
}>(), {
    size: '16px',
    icon: 'home',
    iconSize: '24px'
});

defineEmits<{
    (e: 'click'): void
}>();

const isSpinning = computed(() => isTrue(props.spin) || isTrue(props.loading));
const isDisabled = computed(() => isTrue(props.disabled) || isTrue(props.loading));
const acIconSize = computed(() => props.iconSize);
const acUnsize = computed(() => isTrue(props.inline) ? 'true' : props.unsize);
const acColor = computed(() => isTrue(props.inline) ? 'inline': props.color);

const classes = computed(() => serClasses({
    'inline': isTrue(props.inline),
    'no-text': !props.text,
    'has-text': !!props.text,
    'disabled': isDisabled.value,
    'pad-left': isTrue(props.padLeft),
    'breakpoint': isTrue(props.breakpoint)
}, props.otherClasses, props.class, acColor.value));

const styles = computed(() => {
    const styles : { [key: string]: string } = {
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

    p {
        margin-left: 5px;
        margin-right: 5px;
    }

    &.no-text {
        padding: $icon-padding;
        height: $icon-height;
    }
    &.has-text { padding: 5px 10px; }
    &.primary,
    &.secondary,
    &.danger,
    &.warning,
    &.shade {
        border-color: var(--bg-color-accent);
        background-color: var(--color-primary);
    }

    &.secondary { background-color: var(--color-secondary); }
    &.danger { background-color: var(--color-warning); }
    &.warning { background-color: var(--color-actual-warning); }
    &.shade {
        background-color: var(--bg-color-accent);
        border-color: transparent;
    }
    &.inline {
        background-color: transparent;
        margin: 0;
        padding: 0;
    }
    &.margin-right {
        margin-right: var(--margin) !important;
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

    &.active {
        border-color: var(--color-primary);
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
