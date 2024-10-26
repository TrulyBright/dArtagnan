<script setup lang="ts">
const value = defineModel<string>("value")
const valid = defineModel<boolean>("valid")
defineProps<{
    label: string
    placeholder: string
    maxlength: number
    required: boolean
    pattern: RegExp
}>()
const onInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    value.value = target.value
    valid.value = target.validity.valid
}
</script>
<template>
    <div class="flex flex-col items-center my-1">
        <label :for="$props.label" class="text-sm">{{ $props.label }}</label>
        <input
            type="text"
            class="block mt-2 rounded-md w-fit px-1"
            :name="$props.label"
            :placeholder="$props.placeholder"
            :maxlength="$props.maxlength"
            :required="$props.required"
            :pattern="$props.pattern.source"
            @input="onInput"
        >
    </div>
</template>