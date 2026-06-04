<template>
    <div ref="dropdownElement" class="icon-btn-dropdown">
        <IconBtn
            :text="text"
            :icon="icon"
            :color="color"
            :fill="fill"
            :spin="spin"
            :size="size"
            :icon-size="iconSize"
            :speed="speed"
            :rotate="rotate"
            :unsize="unsize"
            :active="active"
            :disabled="disabled"
            :pad-left="padLeft"
            :breakpoint="breakpoint"
            :invert-breakpoint="invertBreakpoint"
            :loading="loading"
            :inline="inline"
            :other-classes="otherClasses"
            :class="classes"
            :flip="flip"
            :no-boarder="noBoarder"
            :title="title || text"
            :alert-text="alertText"
            :alert-icon="alertIcon"
            @click="toggle"
        />
        <Teleport to="body">
            <div
                v-if="open"
                ref="contentElement"
                class="dropdown-content"
                :class="align"
                :style="dropdownStyles"
            >
                <slot :close="close" :open="open" />
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { booleanish, ClassOptions } from '~/models';

const { serClasses } = useUtils();

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
    align?: 'left' | 'right';

    alertText?: string;
    alertIcon?: string;
}>(), {
    icon: 'more_vert',
    color: 'shade',
    size: '1rem',
    iconSize: '24px',
    align: 'right'
});

const emit = defineEmits<{
    (e: 'open' | 'close'): void;
}>();

defineSlots<{
    default(props: { close: () => void; open: boolean }): unknown;
}>();

const open = ref(false);
const dropdownElement = ref<HTMLElement>();
const contentElement = ref<HTMLElement>();
const dropdownTop = ref(0);
const dropdownLeft = ref(0);

const classes = computed(() => serClasses(
    props.class,
    { 'open': open.value }
));

const dropdownStyles = computed(() => ({
    top: `${dropdownTop.value}px`,
    left: `${dropdownLeft.value}px`
}));

const updatePosition = () => {
    if (!import.meta.client || !dropdownElement.value) return;

    const rect = dropdownElement.value.getBoundingClientRect();
    dropdownTop.value = rect.bottom + 7;
    dropdownLeft.value = props.align === 'left' ? rect.left : rect.right;
};

const close = () => {
    if (!open.value) return;
    open.value = false;
    emit('close');
};

const toggle = () => {
    open.value = !open.value;
    emit(open.value ? 'open' : 'close');
    if (open.value) nextTick(updatePosition);
};

const closeOnOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
        dropdownElement.value?.contains(target) ||
        contentElement.value?.contains(target)
    ) return;

    close();
};

const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    close();
};

const repositionIfOpen = () => {
    if (!open.value) return;
    updatePosition();
};

onMounted(() => {
    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', repositionIfOpen);
    window.addEventListener('scroll', repositionIfOpen, true);
});

onUnmounted(() => {
    document.removeEventListener('click', closeOnOutsideClick);
    document.removeEventListener('keydown', closeOnEscape);
    window.removeEventListener('resize', repositionIfOpen);
    window.removeEventListener('scroll', repositionIfOpen, true);
});
</script>

<style scoped lang="scss">
.icon-btn-dropdown {
    position: relative;
    display: inline-flex;
    overflow: visible;

    :deep(.btn.open) {
        border-color: rgba(255, 255, 255, .2);
        background-color: var(--bg-color-accent-dark);
    }
}

.dropdown-content {
    position: fixed;
    z-index: 10000;
    width: max-content;
    min-width: 210px;
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
    overflow: auto;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: var(--brd-radius);
    background: rgba(20, 17, 22, .98);
    box-shadow: 0 18px 50px rgba(0, 0, 0, .5);

    &.left {
        transform: none;
    }

    &.right {
        transform: translateX(-100%);
    }

    :deep(button),
    :deep(a) {
        display: flex;
        align-items: center;
        gap: .65rem;
        width: 100%;
        min-height: 42px;
        padding: .65rem .8rem;
        border: 0;
        border-bottom: 1px solid rgba(255, 255, 255, .07);
        border-radius: 0;
        background: transparent;
        color: var(--color);
        text-align: left;
        text-decoration: none;

        &:last-child {
            border-bottom: 0;
        }

        &:hover:not(:disabled) {
            cursor: pointer;
            background: rgba(255, 255, 255, .07);
        }

        &:disabled {
            cursor: default;
            opacity: .55;
        }
    }

    :deep(span) {
        white-space: nowrap;
    }
}
</style>
