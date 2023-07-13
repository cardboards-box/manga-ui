<template>
<div class="drawer flex row" :class="{ 'open': open }">
    <div class="title flex center-items" @click="() => open = !open">
        <p class="fill">{{ title }}</p>
        <Icon>{{ open ? 'arrow_drop_up' : 'arrow_drop_down' }}</Icon>
    </div>
    <div class="opener">
        <div class="open-content">
            <slot />
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
defineProps<{ title: string; }>();
const open = ref(true);
</script>

<style lang="scss" scoped>
$bg-color: var(--bg-color-accent);
$max-height: 80vh;
.drawer {
    border-radius: var(--brd-radius);
    margin-bottom: 5px;
    overflow: hidden;
    background-color: $bg-color;

    .title {
        padding: 5px;
        cursor: pointer;
        border-bottom: 1px solid transparent;
        border-top-right-radius: var(--brd-radius);
        border-top-left-radius: var(--brd-radius);
        p { margin: auto 3px; }
    }
    .opener {
        overflow: hidden;
        max-height: 0;
        padding: 0 5px;
        transition: max-height 250ms;
        border-bottom-right-radius: var(--brd-radius);
        border-bottom-left-radius: var(--brd-radius);

        .open-content {
            margin-bottom: 5px;
            padding: 5px;
            max-height: #{$max-height - 1vh};
            overflow-y: auto;
            overflow-x: hidden;
        }
    }

    &.open { 
        .title {
            border-bottom-color: $bg-color;
        }

        .opener { 
            max-height: $max-height;
        }
    }
}
</style>