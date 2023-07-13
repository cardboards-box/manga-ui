import { initializeApp } from "firebase/app";

export default defineNuxtPlugin(app => {
    const config = useRuntimeConfig();
    const firebase = initializeApp(config.public.firebase);

    app.vueApp.provide('firebase', firebase);
    app.provide('firebase', firebase);
});
