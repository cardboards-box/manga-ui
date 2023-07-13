<template>
<div class="control rounded pad bg-accent" :class="moreClasses">
    <label v-if="label">{{ label }}</label>
    <div class="group">
        <input 
            type="color"
            v-model="hex"
            :style="{ 'background-color': hex }" 
        />
        <label>HEX</label>
        <input 
            type="text"
            v-model="hex"
            placeholder="HEX"
            class="fill"
        />
        <template v-if="showAlpha">
            <label>Alpha</label>
            <input 
                type="number"
                min="0"
                max="1"
                step="0.1"
                v-model="a"
                placeholder="Transparency"
                class="fill"
            />
        </template>
        <button @click="paste">
            <Icon>content_paste</Icon>
        </button>
        <template v-if="showMove">
            <button @click="() => $emit('delete')">
                <Icon>delete</Icon>
            </button>
            <button @click="() => $emit('move', -1)">
                <Icon>arrow_upward</Icon>
            </button>
            <button @click="() => $emit('move', 1)">
                <Icon>arrow_downward</Icon>
            </button>
        </template>
    </div>
</div>
</template>

<script setup lang="ts">
import { booleanish, isTrue } from '~/models';
import { ColorTranslator } from 'colortranslator';

const DEFAULT_COLOR = '#000000';

interface Props {
    modelValue?: string;
    label?: string;
    noMove?: booleanish;
    hideAlpha?: booleanish;
    moreClasses?: string;
    default?: string;
}

interface Emits {
    (e: 'update:modelValue', v?: string): void;
    (e: 'delete'): void;
    (e: 'move', v: number): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const showMove = computed(() => !isTrue(props.noMove));
const showAlpha = computed(() => !isTrue(props.hideAlpha));

const getColor = (color?: string) => {
    try {
        return new ColorTranslator(color ?? props.default ?? DEFAULT_COLOR);
    } catch (ex) {
        console.error('Error during color parsing', {
            error: ex,
            value: color
        });
        return new ColorTranslator('#000000');
    }
}

const color = computed(() => getColor(props.modelValue));

const hex = computed({
    get: () => color.value.HEX,
    set: (v: string) => {
        const color = getColor(v);
        broadcast(color.R, color.G, color.B);
    }
})

const broadcast = (r?: number, g?: number, b?: number, a?: number) => {
    const c = color.value;
    if (r) c.setR(r);
    if (g) c.setG(g);
    if (b) c.setB(b);
    if (a) c.setA(a);

    emits('update:modelValue', c.HEXA);
}

const a = computed({
    get: () => color.value.A,
    set: (v: number) => broadcast(undefined, undefined, undefined, v)
});

const paste = async () => {
    const data = await navigator.clipboard.readText();
    if (!data) return;
    const color = getColor(data);
    broadcast(color.R, color.G, color.B, color.A);
}
</script>

<style lang="scss" scoped>
input[type="color"] {
    width: 50px;
    margin: auto 5px;
    cursor: pointer;
}
</style>