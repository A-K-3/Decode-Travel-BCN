<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { BUDGET_CONFIG } from '@/constants/search'

interface Props {
  modelValue?: number
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: BUDGET_CONFIG.default,
  error: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

// Shadcn Slider usa array [value], no un número simple
const budgetArray = computed({
  get: () => [props.modelValue],
  set: (value: number[]) => emit('update:modelValue', value[0])
})

const formattedBudget = computed(() => {
  return props.modelValue.toLocaleString()
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <Label for="budget" class="text-sm font-medium">Budget</Label>
      <span class="text-sm font-semibold text-foreground">{{ formattedBudget }}</span>
    </div>

    <Slider
      id="budget"
      v-model="budgetArray"
      :min="BUDGET_CONFIG.min"
      :max="BUDGET_CONFIG.max"
      :step="BUDGET_CONFIG.step"
      class="w-full"
    />

    <div class="flex justify-between text-xs text-muted-foreground">
      <span>{{ BUDGET_CONFIG.min.toLocaleString() }}</span>
      <span>{{ BUDGET_CONFIG.max.toLocaleString() }}</span>
    </div>

    <p v-if="error" class="text-destructive text-xs">{{ error }}</p>
  </div>
</template>
