<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  checked?: boolean
  class?: string
  id?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  checked: false,
  disabled: false
})

const emits = defineEmits<{
  'update:checked': [value: boolean]
}>()

const toggle = () => {
  if (!props.disabled) {
    emits('update:checked', !props.checked)
  }
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :id="id"
    :disabled="disabled"
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      checked && 'bg-primary text-primary-foreground',
      props.class
    )"
    @click="toggle"
  >
    <span v-if="checked" class="flex h-full w-full items-center justify-center">
      <CheckIcon class="h-3 w-3" />
    </span>
  </button>
</template>
