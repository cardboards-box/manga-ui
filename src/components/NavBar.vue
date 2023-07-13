<template>
<header class="app-header">
    <button @click="() => closed = !closed">
        <Icon>menu</Icon>
    </button>
    <h2>Manga Box</h2>
    <img src="/logo.png" alt="Cardboard Box Logo" />
</header>

<div 
    class="fade" 
    :class="{ open: !closed }" 
    @click="() => closed = !closed" 
/>
<aside class="navbar flex" :class="{ closed }">
    <nav class="flex row scroll-y">
        <div class="title flex">
            <img src="/logo.png" alt="Cardboard Box Logo" />
            <h2>Manga Box</h2>
            <button @click="() => closed = !closed">
                <Icon :rotate="closed ? 90 : 0">
                    {{ closed ? 'push_pin' : 'chevron_left' }}
                </Icon>
            </button>
        </div>

        <NavBarLinkList @naved="onClicked" />
    </nav>
</aside>
</template>

<script setup lang="ts">
const closed = ref(false);

const getWidth = () => {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

const onClicked = () => {
    if (getWidth() <= 1050) {
        closed.value = true;
    }
}
</script>

<style lang="scss">
.app-header {
    display: none;
    padding: 5px;

    button {
        cursor: pointer;
        height: 24px;
    }

    img, h2, button {
        margin: auto 5px;
    }

    img { width: 35px; height: 30px; }
    h2 { 
        margin: auto 5px;
        white-space: pre;
        display: block;
        flex: 1;
        text-align: right;
    }
}

.floating-open {
    display: none;
    position: fixed;
    top: 5px;
    left: 5px;
    border-radius: 50%;
    padding: 5px;
    background-color: var(--bg-color);
    z-index: 1;
    height: 40px;
    width: 40px;
    padding-top: 7px;
}

.fade {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: var(--bg-color-accent-dark);
    z-index: -1;
    opacity: 0;
    transition: all 250ms;
}

.navbar {
    overflow: hidden;
    position: relative;
    background-color: var(--bg-color-accent);

    nav {
        width: var(--nav-width);
        padding: 10px;
        flex: 1;
        transition: all 150ms;

        .title {
            margin-bottom: 20px;

            button { margin: auto 0; }
            img { width: 35px; height: 30px; }
            h2 { 
                margin: auto 5px; 
                flex: 1; 
                white-space: pre;
                display: block;
            }
        }

    }

    &.closed {
        nav {
            width: 45px;
            padding: 5px;

            .title {
                flex-flow: column;
                img { 
                    width: 35px;
                    margin: 0 auto;
                }
                h2 { display: none; }
                button {
                    margin-top: 10px;
                    span { display: inline-block !important; }
                }
            }

            a, button {
                margin: 0 auto;
                p { display: none; }
                span:last-child { display: none; }
            } 
        }
    }
}

@media only screen and (max-width: 1050px) {
    .app-header { display: flex; }

    .fade.open {
        opacity: 1;
        z-index: 10;
    }

    .navbar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        z-index: 10;
        background-color: var(--bg-color);
        transition: margin-left 250ms;

        nav {
            width: var(--nav-width);
            padding: 10px;

            .title {
                h2 { display: block; }
            }
            a {
                p { display: block }
                span:last-child { display: block }
            }
        }

        &.closed { margin-left: calc(var(--nav-width) * -1 - 50px); }
    }
}
</style>