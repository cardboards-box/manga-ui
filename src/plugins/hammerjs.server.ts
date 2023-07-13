export default defineNuxtPlugin(app => {
    app.vueApp.directive('swipe', {
        mounted() { },
        getSSRProps() {
            return {}
        }
    })
});