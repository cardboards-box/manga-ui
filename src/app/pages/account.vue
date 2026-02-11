<template>
<Error v-if="!currentUser" message="You need to be logged in to see your account!"/>
<div v-else class="max-width flex center-items">
    <div class="account flex rounded bg-accent pad center center-items">
        <img class="rounded" :src="currentUser.avatar" />
        <div class="details flex row fill">
            <div class="title">{{ currentUser.username }}</div>
            <div class="email"><b>Email: </b>{{ currentUser.email }}</div>
            <div class="tags in-line" v-if="roles.length > 0">
                <span>Roles:</span>
                <span v-for="role of roles">{{ role }}</span>
            </div>
        </div>
    </div>
</div>
</template>
<script setup lang="ts">
const { currentUser } = useAuthHelper();

const roles = computed(() => {
    const output = [];
    if (currentUser.value?.admin) output.push('Admin');
    if (currentUser.value?.canRead) output.push('User');
    return output;
})

useHead({ title: 'Checking yourself out?' });
</script>
<style lang="scss" scoped>
.account {
    img {
        margin-right: var(--margin);
    }

    .details {
        .title {
            font-size: 1.25rem;
            font-weight: bold;
        }

        .title, .email, .tags {
            margin-top: 5px;
        }

        .tags span:first-child {
            margin-left: 0;
            padding-left: 0;
        }
    }
}
</style>
