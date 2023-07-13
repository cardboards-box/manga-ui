import Hammer from 'hammerjs';

export default defineNuxtPlugin(app => {
    app.vueApp.directive('swipe', {
        mounted(el: HTMLElement) {
            if (!process.client) return;

            let isSwipe = false;

            el.addEventListener('click', (ev) => {
                if (!isSwipe) el.dispatchEvent(new MouseEvent('tap', ev));
            });

            const emit = (name: string, data?: any) => {
                const event = new CustomEvent(name, data);
                el.dispatchEvent(event);
            }

            const hammer = new Hammer(el, {
                domEvents: false
            });
            hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
            hammer.on('swipe', (event) => {
                switch(event.direction) {
                    case Hammer.DIRECTION_LEFT: emit('swipe-left'); break;
                    case Hammer.DIRECTION_RIGHT: emit('swipe-right'); break;
                    case Hammer.DIRECTION_UP: emit('swipe-up'); break;
                    case Hammer.DIRECTION_DOWN: emit('swipe-down'); break;
                }
                isSwipe = true;
                setTimeout(() => isSwipe = false, 0);
            });
        },
        getSSRProps() {
            return {}
        }
    });
});