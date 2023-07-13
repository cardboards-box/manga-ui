<template>
<div class="max-width">
<Tabs>
    <Tab title="Buttons" icon="smart_button">
        <div 
            class="fill-parent"
            v-swipe 
            @swipe-left="() => swipe('left')"
            @swipe-right="() => swipe('right')"
            @swipe-up="() => swipe('up')"
            @swipe-down="() => swipe('down')"
            @tap="(ev: any) => swipe('tap', ev)"
            @click="onClick"
        >
            <div class="some-buttons">
                <IconBtn
                    icon="sync"
                    :rotate="100"
                    fill
                    spin
                    text="Hello world"
                />
                <IconBtn
                    icon="sync"
                    :rotate="100"
                    fill
                    spin
                    text="Hello world"
                    link="/test"
                    active="active"
                />
                <IconBtn
                    icon="sync"
                    speed="1s"
                    fill
                    spin
                    text="Hello world"
                    link="/test"
                    external
                />
                <IconBtn
                    text="Hello world"
                    link="/test"
                    external
                />
                <IconBtn />
                <IconBtn
                    text="Hello world"
                    link="/test"
                    external
                    color="primary"
                />
                <IconBtn
                    text="Hello world"
                    link="/test"
                    external
                    color="secondary"
                />
                <IconBtn
                    text="Hello world"
                    link="/test"
                    external
                    color="danger"
                />
                <IconBtn
                    text="Hello world"
                    link="/test"
                    external
                    color="warning"
                />
                <IconBtn
                    text="Hello world"
                    link="/test"
                    external
                    color="warning"
                    disabled
                />
                
                <IconBtn
                    text="Hello world"
                    link="/test"
                    color="warning"
                    disabled
                />

                
                <IconBtn
                    text="Hello world"
                    color="warning"
                    disabled
                />

                <IconBtn breakpoint color="shade" text="Testing testing" />

                <IconBtn color="shade" />
            </div>
        </div>
    </Tab>
    <Tab title="Input Groups" icon="keyboard">
        <CardList
            title="Testing Input groups"
            :manga="data"
            :pending="pending"
            allow-reload
            @reload="() => reload()"
            @headerstuck="(v) => stuck = v"
            capitalize
        >
            <InputGroup
                v-model="search"
                placeholder="Search for your next binge" 
                :stuck="stuck"
            >
                <template #input>
                    <SelectBox v-model="selected">
                        <option v-for="opt in options" :value="opt">{{ opt }}</option>
                    </SelectBox>
                </template>
            </InputGroup>
        </CardList>
    </Tab>
    <Tab title="dragging" icon="drag_indicator">
        <div class="fill-parent">
            <draggable v-model="todos" item-key="id">
                <template #item="{element: item }">
                    <div class="item">
                        {{ item }}
                    </div>
                </template>
            </draggable>
        </div>
    </Tab>
</Tabs>
</div>
</template>

<script setup lang="ts">
const { randomNum } = useMangaApi();

const options = ['testing', 'hello world', 'how are you'];

const stuck = ref(false);
const open = ref(false);
const selected = ref(options[0]);
const search = ref('');
const { data, pending, refresh } = await randomNum(20);
const todos = ref(['laundry', 'cooking', 'testing code', 'fucking the loli']);

const reload = () => {
    pending.value = true;
    data.value = [];
    refresh();
}

const onClick = (ev: MouseEvent) => {
    //console.log('On click', ev);
}

const swipe = (name: string, event?: any) => {
    // console.log('Swiped', {
    //     name,
    //     event
    // });
}
</script>