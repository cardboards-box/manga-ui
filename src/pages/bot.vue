<template>
    <div class="max-width flex row margin-top scroll-y">
        <h2 class="margin-top">Discord Bot</h2>
        <p class="margin-top">
            There is a discord bot that can perform these searches directly in your favourite server! <br>
            You can react to the image with 🍝, 🔍 or 🔎 and it will find an image the source for the page! <br>
            You can also use the slash command <code>/manga-image-lookup url:https://your-porn-manga.com/yuri-is-best</code> and it will perform the same search <br>
            There are plans to move it to a stand alone bot as currently it's baked in with a bot that has a bunch of other features... but for now... <br>
            You can install it by going <a :href="url" target="_blank">here</a> and following the discord prompt.
        </p>
        <div class="center-horz margin-top">
            <IconBtn
                :link="url"
                icon="link"
                text="Invite to your server"
                color="primary"
                external
            />
            <IconBtn
                :link="rate"
                icon="star"
                text="Rate it!"
                color="secondary"
                class="margin-left"
                external
            />
        </div>

        <h2 class="margin-top">Examples:</h2>

        <div class="flex row margin-top">
            <Image
                class="center-horz"
                src="/bot-usage-1.png"
                height="500px"
            />
            <Image
                class="center-horz margin-top"
                src="/bot-usage-2.png"
            />
        </div>

        <br>
    </div>
</template>

<script setup lang="ts">

const url = ref('https://discord.com/api/oauth2/authorize?client_id=905632533981577247&permissions=8&scope=bot%20applications.commands');
const rate = ref('https://top.gg/bot/1324859527480475710');
</script>

<style lang="scss" scoped>
a {
    text-decoration: underline;
}

.max-width {
    padding-bottom: 5rem;
}
</style>
