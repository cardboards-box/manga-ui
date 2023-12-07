<template>
    <div class="manga-data">
        {{ pending }} <br />
        {{ error }} <br />
        {{ output }}
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    pageTransition: false,
    layoutTransition: false,
    layout: 'nohead'
});

const DEFAULT_IMAGE = '/broken.png';

const { data, inRegions, genLink, unauthed } = useReaderHelper();
const { output, pending, error, refresh } = data();

await refresh();
</script>

<style scoped lang="scss">

</style>
