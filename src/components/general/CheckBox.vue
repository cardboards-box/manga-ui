<template>
    <label 
        :tabindex="disabled ? -1 : 0"
        class="checkbox"
        role="checkbox"
        :for="id"
        :aria-disabled="disabled"
        :aria-checked="value"
        @keydown.space.prevent="toggle"
        @click.stop.prevent="toggle"
    >
        <slot name="pre" />
        <span class="wrap">
            <Icon>{{ value ? 'check_box' : 'check_box_outline_blank' }}</Icon>
            <input 
                type="checkbox" 
                :id="id" 
                hidden
                :disabled="disabled"
                :modelValue="modelValue"
                @update:modelValue="(e: any) => value = e.target.checked" 
            />
        </span>
        <span v-if="hasLabel">
            <slot v-if="!label" />
            <template v-else>{{ labelText }}</template>
        </span>
    </label>
</template>

<script setup lang="ts">
    const slots = useSlots();

    interface Emits {
        (e: 'update:modelValue', value: boolean): void;
    }

    interface Props {
        label?: string;
        modelValue: boolean;
        disabled?: boolean;
    }

    const emit = defineEmits<Emits>();
    const props = defineProps<Props>();

    const id = ref(`chk-${Math.random().toString()}`);
    const value = computed({
        get() {
            return props.modelValue;
        },
        set(value: boolean) {
            emit("update:modelValue", value);
        },
    });

    const toggle = () => {
        if (!props.disabled) { value.value = !value.value;  }
    }

    const labelText = computed(() => props.label || slots.default);
    const hasLabel = computed(() => !!labelText.value);

</script>

<style lang="scss" scoped>
    label {
        position: relative;
        display: flex;
        align-items: center;
        user-select: none;

        .wrap {
            display: inline-flex;
            align-items: center;
        }
    }
</style>