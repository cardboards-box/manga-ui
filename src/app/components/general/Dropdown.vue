<template>
<div
    ref="anchor"
    class="dropdown-anchor"
    :class="classes"
    @click="onAnchorClick"
    @focusout="onFocusOut"
    @keydown.esc.stop="close"
>
    <slot
        name="trigger"
        :open="open"
        :toggle="toggle"
        :close="close"
        :trigger-props="triggerProps"
    />

    <Teleport to="body">
        <div
            v-if="mounted && open"
            ref="panel"
            class="dropdown-panel"
            :class="panelClass"
            :style="panelStyle"
            tabindex="-1"
            @focusout="onFocusOut"
            @keydown.esc.stop="close"
        >
            <slot
                :open="open"
                :close="close"
            />
        </div>
    </Teleport>
</div>
</template>

<script setup lang="ts">
import type { ClassOptions } from '~/models';

type Placement = 'bottom' | 'top' | 'auto';
type Align = 'left' | 'right' | 'center';

const { serClasses } = useUtils();

const props = withDefaults(defineProps<{
    modelValue?: boolean;
    placement?: Placement;
    align?: Align;
    offset?: number;
    matchWidth?: boolean;
    minWidth?: number;
    maxHeight?: number;
    closeOnSelect?: boolean;
    panelClass?: ClassOptions;
    'class'?: ClassOptions;
}>(), {
    placement: 'auto',
    align: 'left',
    offset: 6,
    minWidth: 180,
    maxHeight: 360,
    closeOnSelect: false
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'open' | 'close'): void;
}>();

defineSlots<{
    trigger(props: { open: boolean; toggle: (event?: Event) => void; close: () => void; triggerProps: Record<string, unknown> }): unknown;
    default(props: { open: boolean; close: () => void }): unknown;
}>();

const anchor = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const mounted = ref(false);
const internalOpen = ref(false);
const instance = getCurrentInstance();
const top = ref(0);
const left = ref(0);
const width = ref<number>();
const maxPanelHeight = ref(props.maxHeight);
let resizeObserver: ResizeObserver | undefined;
let animationFrame: number | undefined;
const handledTriggerEvents = new WeakSet<Event>();
let ignoreNextAnchorClick = false;

const isControlled = computed(() => {
    const vnodeProps = instance?.vnode.props ?? {};
    return Object.prototype.hasOwnProperty.call(vnodeProps, 'modelValue')
        || Object.prototype.hasOwnProperty.call(vnodeProps, 'onUpdate:modelValue');
});

const open = computed({
    get: () => isControlled.value ? props.modelValue : internalOpen.value,
    set: (value: boolean) => {
        if (value === open.value) return;

        if (!isControlled.value) internalOpen.value = value;
        emit('update:modelValue', value);
        emit(value ? 'open' : 'close');
    }
});

const classes = computed(() => serClasses(props.class, {
    open: open.value
}));

const panelStyle = computed(() => ({
    top: `${top.value}px`,
    left: `${left.value}px`,
    width: width.value ? `${width.value}px` : undefined,
    minWidth: `${props.minWidth}px`,
    maxHeight: `${maxPanelHeight.value}px`
}));

const triggerProps = computed(() => ({
    'aria-expanded': open.value,
    'data-dropdown-trigger': true,
    onClick: toggle
}));

const schedulePosition = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updatePosition);
};

const updatePosition = () => {
    if (!import.meta.client || !anchor.value || !panel.value) return;

    const anchorRect = anchor.value.getBoundingClientRect();
    const panelRect = panel.value.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const margin = 8;
    const below = viewportHeight - anchorRect.bottom - props.offset - margin;
    const above = anchorRect.top - props.offset - margin;
    const useTop = props.placement === 'top'
        || (props.placement === 'auto' && below < panelRect.height && above > below);

    maxPanelHeight.value = Math.max(120, Math.min(props.maxHeight, useTop ? above : below));
    width.value = props.matchWidth ? anchorRect.width : undefined;

    const panelWidth = props.matchWidth ? anchorRect.width : panelRect.width;
    const nextTop = useTop
        ? anchorRect.top - props.offset - Math.min(panelRect.height, maxPanelHeight.value)
        : anchorRect.bottom + props.offset;

    const alignedLeft = (() => {
        if (props.align === 'right') return anchorRect.right - panelWidth;
        if (props.align === 'center') return anchorRect.left + (anchorRect.width / 2) - (panelWidth / 2);
        return anchorRect.left;
    })();

    top.value = Math.max(margin, Math.min(nextTop, viewportHeight - margin - Math.min(panelRect.height, maxPanelHeight.value)));
    left.value = Math.max(margin, Math.min(alignedLeft, viewportWidth - margin - panelWidth));
};

const containsTarget = (target: EventTarget | null | undefined) => {
    if (!(target instanceof Node)) return false;

    return !!anchor.value?.contains(target) || !!panel.value?.contains(target);
};

const openDropdown = () => {
    if (open.value) return;

    open.value = true;
    nextTick(schedulePosition);
};

const close = () => {
    if (!open.value) return;
    open.value = false;
};

const toggle = (event?: Event) => {
    if (event) handledTriggerEvents.add(event);
    ignoreNextAnchorClick = true;
    setTimeout(() => ignoreNextAnchorClick = false);

    if (open.value) close();
    else openDropdown();
};

const onAnchorClick = (event: MouseEvent) => {
    if (ignoreNextAnchorClick) {
        ignoreNextAnchorClick = false;
        return;
    }

    if (handledTriggerEvents.has(event)) return;
    if (containsTarget(panel.value) || open.value) return;

    openDropdown();
};

const onPointerDown = (event: PointerEvent) => {
    if (!open.value || containsTarget(event.target)) return;
    close();
};

const onFocusIn = (event: FocusEvent) => {
    if (!open.value || containsTarget(event.target)) return;
    close();
};

const onFocusOut = () => {
    setTimeout(() => {
        if (!open.value || containsTarget(document.activeElement)) return;
        close();
    });
};

const onPanelClick = (event: MouseEvent) => {
    if (!props.closeOnSelect) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('button, a, [role="option"], [data-dropdown-close]')) return;

    close();
};

const repositionIfOpen = () => {
    if (!open.value) return;
    schedulePosition();
};

watch(open, async (value) => {
    if (!value) return;
    await nextTick();
    schedulePosition();
});

onMounted(() => {
    mounted.value = true;
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('resize', repositionIfOpen);
    window.addEventListener('scroll', repositionIfOpen, true);

    resizeObserver = new ResizeObserver(repositionIfOpen);
    if (anchor.value) resizeObserver.observe(anchor.value);

    watch(panel, (value, oldValue) => {
        if (oldValue) resizeObserver?.unobserve(oldValue);
        if (value) resizeObserver?.observe(value);
    }, { immediate: true });
});

onUnmounted(() => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('resize', repositionIfOpen);
    window.removeEventListener('scroll', repositionIfOpen, true);
    panel.value?.removeEventListener('click', onPanelClick);
    resizeObserver?.disconnect();

    if (animationFrame) cancelAnimationFrame(animationFrame);
});

watch(panel, (value, oldValue) => {
    oldValue?.removeEventListener('click', onPanelClick);
    value?.addEventListener('click', onPanelClick);
});

defineExpose({
    open: openDropdown,
    close,
    toggle,
    updatePosition
});
</script>

<style scoped lang="scss">
.dropdown-anchor {
    display: inline-block;
    overflow: visible;
    position: relative;

    &.open {
        z-index: 2;
    }
}

.dropdown-panel {
    background-color: var(--bg-color);
    border: 1px solid var(--bg-color-accent-dark);
    border-radius: var(--brd-radius);
    box-shadow: 0 14px 40px rgba(0, 0, 0, .42);
    color: var(--color);
    max-width: calc(100vw - 16px);
    overflow-x: hidden;
    overflow-y: auto;
    position: fixed;
    z-index: 10000;

    &:focus {
        outline: none;
    }

    :deep(button),
    :deep(a),
    :deep([role="option"]) {
        color: var(--color);
    }
}
</style>
