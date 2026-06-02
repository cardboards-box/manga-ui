<template>
    <section class="covers-tab">
        <button
            v-for="(cover, index) in covers"
            :key="cover.id"
            class="cover-tile"
            @click="lightboxIndex = index"
        >
            <Cover :image="cover" type="background" width="100%" height="100%" />
            <span>
                <Icon>zoom_in</Icon>
                Cover {{ coverNumber(cover, index) }}
            </span>
        </button>

        <ClientOnly>
            <div class="lightbox" v-if="currentCover" @click="lightboxIndex = undefined">
                <button class="close" @click.stop="lightboxIndex = undefined">
                    <Icon>close</Icon>
                </button>
                <button class="previous" :disabled="lightboxIndex === 0" @click.stop="previous">
                    <Icon>chevron_left</Icon>
                </button>
                <div class="lightbox-card" @click.stop>
                    <Cover :image="currentCover" type="background" width="100%" height="100%" />
                    <p>Cover {{ currentCoverNumber }}</p>
                </div>
                <button class="next" :disabled="lightboxIndex === covers.length - 1" @click.stop="next">
                    <Icon>chevron_right</Icon>
                </button>
            </div>
        </ClientOnly>
    </section>
</template>

<script setup lang="ts">
import type { MbImage } from '~/models';

const props = defineProps<{
    covers: MbImage[];
}>();

const lightboxIndex = ref<number>();
const currentCover = computed(() => lightboxIndex.value === undefined ? undefined : props.covers[lightboxIndex.value]);
const coverNumber = (cover: MbImage, index: number) => cover.ordinal ?? index + 1;
const currentCoverNumber = computed(() => {
    if (!currentCover.value || lightboxIndex.value === undefined) return '';
    return coverNumber(currentCover.value, lightboxIndex.value);
});

const previous = () => {
    if (lightboxIndex.value === undefined) return;
    lightboxIndex.value = Math.max(0, lightboxIndex.value - 1);
};

const next = () => {
    if (lightboxIndex.value === undefined) return;
    lightboxIndex.value = Math.min(props.covers.length - 1, lightboxIndex.value + 1);
};
</script>

<style scoped lang="scss">
.covers-tab {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    gap: 1rem;

    .cover-tile {
        position: relative;
        aspect-ratio: 2 / 3;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, .1);
        border-radius: 8px;
        background: var(--bg-color-accent);

        span {
            position: absolute;
            inset: auto 0 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: .35rem;
            padding: 1.5rem .5rem .6rem;
            background: linear-gradient(0deg, rgba(0, 0, 0, .82), transparent);
            color: #fff;
            font-size: .78rem;
            opacity: 0;
            transition: opacity 160ms;
        }

        &:hover {
            cursor: pointer;
            border-color: var(--color-primary);

            span { opacity: 1; }
        }
    }
}

.lightbox {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, .92);

    button {
        position: absolute;
        border: 0;
        background: transparent;
        color: rgba(255, 255, 255, .72);

        &:hover:not(:disabled) {
            color: #fff;
            cursor: pointer;
        }

        &:disabled {
            opacity: .25;
        }
    }

    .close {
        top: 1rem;
        right: 1rem;
    }

    .previous { left: 1rem; }
    .next { right: 1rem; }

    .lightbox-card {
        width: min(calc((100vh - 5rem) * 2 / 3), calc(100vw - 7rem));
        max-width: calc(100vw - 7rem);
        text-align: center;

        > :first-child {
            aspect-ratio: 2 / 3;
            width: 100%;
            max-height: calc(100vh - 5rem);
            border-radius: 8px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, .6);
        }

        p {
            margin-top: .8rem;
            color: rgba(255, 255, 255, .75);
        }
    }
}
</style>
