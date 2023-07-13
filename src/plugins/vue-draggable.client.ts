import draggable from 'vuedraggable';

export default defineNuxtPlugin((app) => {
    app.vueApp.component('draggable', draggable);
})