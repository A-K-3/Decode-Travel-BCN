<script setup lang="ts">
import { computed } from 'vue'
import { GUESTS_CONFIG } from '@/constants/search'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Props {
  modelValue?: number
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: GUESTS_CONFIG.default,
  error: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const guests = computed({
  get: () => props.modelValue,
  set: (value: number) => emit('update:modelValue', value)
})
</script>

<template>
  <div class="space-y-2">
    <Label for="guests">Guests</Label>
    <Input
      id="guests"
      v-model.number="guests"
      type="number"
      :min="GUESTS_CONFIG.min"
      :max="GUESTS_CONFIG.max"
      :aria-invalid="!!error"
    />
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
  </div>
</template>
