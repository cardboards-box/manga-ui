<template>
    <div
        class="pager flex pad-left"
        :class="{ 'margin-top': topMargin }"
    >
        <p class="center-vert margin-right mute">
            {{ start }} - {{ end }} of {{ total }}
        </p>
        <IconBtn
            :disabled="1 == page || total == 0"
            icon="keyboard_double_arrow_left"
            :link="link(1)"
            @click="goNext(1)"
            no-boarder
        />
        <IconBtn
            icon="chevron_left"
            :disabled="page <= 1 || total == 0"
            :link="link(page - 1)"
            @click="goNext(page - 1)"
            no-boarder
        />
        <IconBtn
            v-for="i in options"
            icon=""
            :text="i.toString()"
            :link="link(i)"
            @click="goNext(i)"
            :no-boarder="i != page"
            :other-classes="i == page ? 'router-link-active' : ''"
        />
        <IconBtn
            icon="chevron_right"
            :disabled="page >= pages || total == 0"
            :link="link(page + 1)"
            @click="goNext(page + 1)"
            no-boarder
        />
        <IconBtn
            :disabled="pages == page || total == 0"
            icon="keyboard_double_arrow_right"
            :link="link(pages)"
            @click="goNext(pages)"
            no-boarder
        />
    </div>
</template>

<script setup lang="ts">
import type { booleanish } from '~/models';

const PAGED_BUTTONS = 2;

const { isTrue } = useUtils();

const props = defineProps<{
    page: number;
    pages: number;
    size: number;
    total: number;
    url?: string;
    params?: {
        [key: string]: any;
    },
    noTopMargin?: booleanish;
}>();

const emits = defineEmits<{
    (e: 'load-page', v: number): void;
}>();
const start = computed(() => Math.max((props.page - 1) * props.size, 1));
const end = computed(() => Math.min(props.page * props.size, props.total));
const topMargin = computed(() => !isTrue(props.noTopMargin));
const options = computed(() =>
    Array(props.pages)
        .fill(0)
        .map((_, i) => i + 1)
        .filter(i =>
            i >= props.page - PAGED_BUTTONS &&
            i <= props.page + PAGED_BUTTONS
        ));

const link = (page: number) => {
    if (!props.url) return undefined;

    const params = props.params ?? {};
    params.page = page;
    return `${props.url}?${Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')}`;
}

const goNext = (page: number) => {
    emits('load-page', page);
}

</script>

<style scoped lang="scss">

</style>
