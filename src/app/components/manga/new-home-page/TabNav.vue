<template>
    <nav class="new-home-tabs">
        <div>
            <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="{ active: modelValue === tab.id }"
                @click="$emit('update:modelValue', tab.id)"
            >
                <Icon>{{ tab.icon }}</Icon>
                <span>{{ tab.label }}</span>
            </button>
        </div>
    </nav>
</template>

<script setup lang="ts">
export type NewHomeTab = 'chapters' | 'info' | 'covers' | 'recommended' | 'admin';

const props = defineProps<{
    modelValue: NewHomeTab;
    admin?: boolean;
}>();

defineEmits<{
    (e: 'update:modelValue', value: NewHomeTab): void;
}>();

const tabs = computed<{ id: NewHomeTab; label: string; icon: string }[]>(() => [
    { id: 'chapters', label: 'Chapters', icon: 'list' },
    { id: 'info', label: 'Info', icon: 'info' },
    { id: 'covers', label: 'Alt. Covers', icon: 'image' },
    { id: 'recommended', label: 'You May Like', icon: 'auto_awesome' },
    ...(props.admin ? [{ id: 'admin' as NewHomeTab, label: 'Admin', icon: 'admin_panel_settings' }] : [])
]);
</script>

<style scoped lang="scss">
.new-home-tabs {
    position: sticky;
    top: 0;
    z-index: 5;
    border-bottom: 1px solid rgba(255, 255, 255, .08);
    background: rgba(12, 9, 12, .9);
    backdrop-filter: blur(14px);

    > div {
        display: flex;
        width: min(1180px, calc(100% - 2rem));
        margin: 0 auto;
        overflow-x: auto;
    }

    button {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        padding: .95rem 1rem;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: var(--color-muted-light);
        white-space: nowrap;
        font-weight: 500;

        &.active {
            border-bottom-color: var(--color-primary);
            color: var(--color-primary);
        }

        &:hover {
            color: var(--color);
            cursor: pointer;
        }
    }
}

@media only screen and (max-width: 600px) {
    .new-home-tabs {
        > div {
            justify-content: space-between;
            overflow-x: hidden;
        }

        button {
            flex: 0 0 auto;
            justify-content: center;
            min-width: 44px;
            padding: .85rem .7rem;

            span {
                display: none;
            }

            &.active {
                gap: .4rem;
                min-width: 0;

                span {
                    display: inline;
                }
            }
        }
    }
}
</style>
