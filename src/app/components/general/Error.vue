<template>
    <div class="flex fill-parent">
        <div class="center flex row center-items error-comp">
            <img src="/error.gif" alt="An error gif" />
            <h2 class="text-center">An error occurred!</h2>
            <p class="text-center">{{ message }}</p>

            <IconBtn
                v-if="shouldShowReset"
                :icon="resetIcon ?? 'refresh'"
                :text="resetText ?? ''"
                pad-left
                @click="emits('reset')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { booleanish } from '~/models';

const { isTrue } = useUtils();

const props = defineProps<{
    message: string,
    showReset?: booleanish,
    resetText?: string,
    resetIcon?: string
}>();

const emits = defineEmits<{
    (reset: string): void
}>();

const shouldShowReset = computed(() => isTrue(props.showReset));
</script>

<style lang="scss" scoped>
.error-comp img {
    height: 75px;
    width: 75px;
}
</style>
