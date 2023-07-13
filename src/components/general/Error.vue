<template>
    <div class="flex fill-parent">
        <div class="center flex row center-items error-comp">
            <img src="/error.gif" alt="An error gif" />
            <h2 class="text-center">An error occurred!</h2>
            <p class="text-center">{{ message }}</p>
        </div>
    </div>
</template>

<script setup>
defineProps({ message: String });
</script>

<style lang="scss" scoped>
.error-comp img { 
    height: 75px;
    width: 75px;
}
</style>