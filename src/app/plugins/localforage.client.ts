import localforage from 'localforage';

export default defineNuxtPlugin(() => {
    localforage.config({
        name: 'manga-box',
        storeName: 'manga-box',
        version: 1.0,
        description: 'Manga Box data storage',
        driver: [
            localforage.INDEXEDDB, 
            localforage.WEBSQL, 
            localforage.LOCALSTORAGE
        ]
    });

    return {
        provide: {
            db: localforage
        }
    }
});