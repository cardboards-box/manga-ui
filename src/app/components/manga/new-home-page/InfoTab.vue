<template>
    <section class="info-tab">
        <div v-if="manga.description">
            <h2>Synopsis</h2>
            <Markdown :content="manga.description" />
        </div>

        <div v-if="manga.altTitles.length">
            <h2>Alternative Titles</h2>
            <ol class="alt-titles">
                <li v-for="(title, index) in manga.altTitles" :key="title">
                    <span>{{ (index + 1).toString().padStart(2, '0') }}</span>
                    {{ title }}
                </li>
            </ol>
        </div>

        <dl class="details-grid">
            <div v-if="source">
                <dt>Source</dt>
                <dd>{{ source.name }}</dd>
            </div>
            <div v-if="extended?.volumeCount">
                <dt>Volumes</dt>
                <dd>{{ extended.volumeCount }}</dd>
            </div>
            <div v-if="extended?.uniqueChapterCount">
                <dt>Chapters</dt>
                <dd>{{ extended.uniqueChapterCount }}</dd>
            </div>
            <div v-if="extended?.views">
                <dt>Views</dt>
                <dd>{{ extended.views.toLocaleString() }}</dd>
            </div>
            <div v-if="extended?.favorites">
                <dt>Favorites</dt>
                <dd>{{ extended.favorites.toLocaleString() }}</dd>
            </div>
            <div v-if="manga.sourceCreated">
                <dt>Source Created</dt>
                <dd><Date :date="manga.sourceCreated" utc format="DD" /></dd>
            </div>
            <div v-for="attr in manga.attributes" :key="attr.name + attr.value">
                <dt>{{ attr.name }}</dt>
                <dd>{{ attr.value }}</dd>
            </div>
        </dl>

        <div v-if="authors.length || artists.length" class="people-grid">
            <div v-if="authors.length">
                <h2>Authors</h2>
                <div class="tag-row">
                    <span v-for="person in authors" :key="person.id">{{ person.name }}</span>
                </div>
            </div>

            <div v-if="artists.length">
                <h2>Artists</h2>
                <div class="tag-row">
                    <span v-for="person in artists" :key="person.id">{{ person.name }}</span>
                </div>
            </div>
        </div>

        <div v-if="tags.length">
            <h2>Genres</h2>
            <div class="tag-row">
                <NuxtLink
                    v-for="tag in tags"
                    :key="tag.id"
                    :to="'/search/all?include=' + tag.id"
                    :title="tag.description"
                >
                    {{ tag.name }}
                </NuxtLink>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { RelationshipType } from '~/models';
import type { MbManga, MbMangaExt, MbRelatedPerson, MbSource, MbTag } from '~/models';

const props = defineProps<{
    manga: MbManga;
    extended?: MbMangaExt;
    source?: MbSource;
    tags: MbTag[];
    people: MbRelatedPerson[];
}>();

const authors = computed(() => props.people.filter(person => person.type === RelationshipType.Author));
const artists = computed(() => props.people.filter(person => person.type === RelationshipType.Artist));
</script>

<style scoped lang="scss">
.info-tab {
    display: grid;
    gap: 2rem;
    max-width: 820px;

    h2 {
        margin-bottom: .75rem;
        color: var(--color-muted-light);
        font-size: .78rem;
        text-transform: uppercase;
        letter-spacing: 0;
    }

    .alt-titles {
        display: grid;
        gap: .55rem;
        margin: 0;
        padding: 0;
        list-style: none;

        li {
            color: rgba(220, 221, 222, .85);
        }

        span {
            display: inline-block;
            width: 2rem;
            color: var(--color-primary);
            font-size: .75rem;
        }
    }

    .details-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem 2rem;
        margin: 0;

        dt {
            color: var(--color-muted-light);
            font-size: .72rem;
            text-transform: uppercase;
        }

        dd {
            margin: .25rem 0 0;
            word-break: break-word;
        }
    }

    .people-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem 2rem;
    }

    .tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: .5rem;

        a,
        span {
            padding: .35rem .65rem;
            border: 1px solid rgba(255, 255, 255, .1);
            border-radius: var(--brd-radius);
            background: var(--bg-color-accent);
            color: var(--color);
            text-decoration: none;
            font-size: .8rem;
        }
    }
}

@media only screen and (max-width: 760px) {
    .info-tab {
        .details-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .people-grid {
            grid-template-columns: 1fr;
        }
    }
}

@media only screen and (max-width: 520px) {
    .info-tab .details-grid {
        grid-template-columns: 1fr;
    }
}
</style>
