<template>
    <ListSearch :type="ListType.Mine">
        <template #default="{ list }">
            <IconBtn
                :link="`/list/${list.entity.id}/edit`"
                inline
                icon="edit"
                title="Edit list"
                color="shade"
            />
        </template>
    </ListSearch>
</template>

<script setup lang="ts">
import { ListType } from '~/models';
</script>
