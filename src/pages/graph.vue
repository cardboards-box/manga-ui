<template>
<div class="max-width graph">
    <Tabs>
        <Tab 
            title="Favourite Tags" 
            icon="favorite" 
            scrollable 
            keep-alive
        >
            <div class="tab-content fill flex row margin">
                <div class="control">
                    <label>Manga Filter:</label>
                    <select v-model="state">
                        <option 
                            v-for="state in states" 
                            :value="state"
                        >
                            {{ state }}
                        </option>
                    </select>
                </div>
                <Loading inline v-if="pending" />
                <div v-else class="grid responsive graph-tags">
                    <NuxtLink 
                        :to="'/search/all?include=' + gra.key" 
                        class="flex center-items pad rounded bg-accent" 
                        v-for="(gra, index) in data"
                    >
                        <p class="fill">#{{ index + 1 }}) {{ gra.key }}</p>
                        <p>{{ gra.count }}</p>
                    </NuxtLink>
                </div>
            </div>
        </Tab>
        <Tab 
            title="By Month" 
            icon="timeline" 
            scrollable keep-alive
        >
            <h1>Coming Soon &trade;</h1>
        </Tab>
    </Tabs>
</div>
</template>

<script setup lang="ts">
import { States } from '~/models';

const { graph } = useMangaApi();
useHead({ title: 'Interested in your favourite tags?' });

const states: States[] = [
    'favourite', 'completed', 
    'inprogress', 'bookmarked', 
    'else', 'touched', 'all'
];
const state = ref<States>('all');
const { pending, data } = await graph(state);
</script>

<style lang="scss" scoped>
.graph {
    .graph-tags {
        margin-top: var(--margin);
    }
}
</style>