<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const message = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val)
})

const handleSubmit = (): void => {
  emit('submit')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-center">Travel Assistant</CardTitle>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="flex gap-2">
        <Input
          v-model="message"
          type="text"
          placeholder="Ask me anything..."
          class="flex-1"
        />
        <Button type="submit">
          Send
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
