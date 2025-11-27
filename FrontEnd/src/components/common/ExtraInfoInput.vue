<script setup lang="ts">
import { computed } from 'vue'
import { VALIDATION_RULES } from '@/constants/search'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  modelValue?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  error: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const extraInfo = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val)
})

const maxChars = VALIDATION_RULES.maxExtraInfoChars
</script>

<template>
  <div class="space-y-2">
    <Label for="extraInfo">
      Extra Info <span class="text-muted-foreground font-normal">(optional)</span>
    </Label>
    <Textarea
      id="extraInfo"
      v-model="extraInfo"
      :maxlength="maxChars"
      rows="2"
      placeholder="Hotel with spa, first class flight, near to the beach..."
      class="resize-none"
      :aria-invalid="!!error"
    />
    <div class="flex justify-between text-xs">
      <p v-if="error" class="text-destructive">{{ error }}</p>
      <span :class="modelValue.length > maxChars ? 'text-destructive' : 'text-muted-foreground'" class="ml-auto">
        {{ modelValue.length }}/{{ maxChars }}
      </span>
    </div>
  </div>
</template>
