<template>
<div class="flex" :class="{ 'fill-parent': !inline }">
    <div class="center flex loading-comp">
        <img src="/kitsu.gif" alt="Loading Kitsu!" />
        <p>Loading...</p>
    </div>
</div>
</template>

<script setup lang="ts">
defineProps<{ inline?: boolean }>();
</script>

<style lang="scss">
.loading-comp {
    img { height: 75px; }
    p { margin: auto 10px; }
}
</style>