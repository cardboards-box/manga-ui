<template>
    <div v-if="!hasLink" class="card-tag" :style="styles">
        <slot />
    </div>
    <NuxtLink
        v-else
        :to="props.link"
        :target="external ? '_blank' : undefined"
        class="card-tag" :style="styles"
    >
        <slot />
    </NuxtLink>
</template>

<script lang="ts" setup>
import type { booleanish } from '~/models';

const { isTrue, serStyles } = useUtils();

const props = defineProps<{
    color?: string;
    nsfw?: booleanish;
    link?: string;
}>();

const actColor = computed(() => {
    if (props.color) return props.color;
    if (isTrue(props.nsfw)) return 'var(--color-warning)';
    return 'var(--color-default)';
});

const styles = computed(() => serStyles({
    'background-color': actColor.value,
    'text-transform': isTrue(props.nsfw) ? 'capitalize' : undefined
}));

const hasLink = computed(() => !!props.link);
const external = computed(() => hasLink.value && props.link!.toLocaleLowerCase().startsWith('http'));
</script>

<style lang="scss" scoped>
.card-tag {
    display: inline-block;
    padding: 3px 5px;
    margin: 3px;
    border: 1px solid var(--bg-color-offset);
    border-radius: 3px;
}
</style>
