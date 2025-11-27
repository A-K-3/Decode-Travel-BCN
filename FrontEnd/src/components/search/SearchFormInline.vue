<script setup lang="ts">
import { watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import DateRangePicker from '@/components/DateRangePicker.vue'
import FlightDatePicker from '@/components/search/FlightDatePicker.vue'
import { useSearchStore } from '@/composables/useSearchStore'
import { useSearchValidation } from '@/composables/useSearchValidation'
import { usePromptGenerator } from '@/composables/usePromptGenerator'
import { SEARCH_TABS, BUDGET_CONFIG, GUESTS_CONFIG } from '@/constants/search'
import type { DateRangeData } from '@/types'

interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'search': [prompt: string]
}>()

const {
  activeTab,
  origin,
  destination,
  dateRangeValue,
  dateRangeData,
  flightDateType,
  singleFlightDate,
  budget,
  guests,
  getFormData,
  setSearchData
} = useSearchStore()

const { errors, clearErrors, clearError, validateForm } = useSearchValidation()
const { generatePrompt } = usePromptGenerator()

const handleRangeUpdate = (range: DateRangeData): void => {
  dateRangeData.value = range
}

const handleSubmit = (): void => {
  const formData = getFormData()
  if (!validateForm(formData)) {
    return
  }
  const prompt = generatePrompt(formData)
  setSearchData({ generatedPrompt: prompt })
  emit('search', prompt)
}

watch(activeTab, () => {
  clearErrors()
})

watch(flightDateType, () => {
  clearError('dates')
})
</script>

<template>
  <div class="w-full flex justify-center">
    <Tabs v-model="activeTab" class="w-full max-w-7xl">
      <form class="flex flex-col gap-3 xl:flex-row xl:items-end xl:flex-wrap xl:justify-center" @submit.prevent="handleSubmit">
        <div class="flex justify-center">
          <TabsList class="grid grid-cols-3 w-fit">
            <TabsTrigger
              v-for="tab in SEARCH_TABS"
              :key="tab.id"
              :value="tab.id"
              class="text-xs px-3"
            >
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </div>

        <div class="flex items-end gap-3 flex-wrap justify-center">
        <div v-if="activeTab !== 'hotel'" class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted-foreground">Origin</label>
          <Input
            v-model="origin"
            type="text"
            placeholder="From"
            class="w-32"
            :aria-invalid="!!errors.origin"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted-foreground">Destination</label>
          <Input
            v-model="destination"
            type="text"
            placeholder="To"
            class="w-32"
            :aria-invalid="!!errors.destination"
          />
        </div>

        <div class="flex flex-col gap-1">
          <template v-if="activeTab === 'flights'">
            <RadioGroup v-model="flightDateType" class="flex gap-3">
              <div class="flex items-center space-x-1">
                <RadioGroupItem id="inline-one-way" value="single" />
                <Label for="inline-one-way" class="cursor-pointer text-xs font-normal">One way</Label>
              </div>
              <div class="flex items-center space-x-1">
                <RadioGroupItem id="inline-round-trip" value="range" />
                <Label for="inline-round-trip" class="cursor-pointer text-xs font-normal">Round trip</Label>
              </div>
            </RadioGroup>
            <FlightDatePicker
              v-model:flightDateType="flightDateType"
              v-model:rangeValue="dateRangeValue"
              v-model:singleDate="singleFlightDate"
              :error="errors.dates"
              hide-radio
              @update:range="handleRangeUpdate"
            />
          </template>
          <template v-else>
            <label class="text-xs font-medium text-muted-foreground">Dates</label>
            <DateRangePicker
              v-model="dateRangeValue"
              :error="!!errors.dates"
              @update:range="handleRangeUpdate"
            />
          </template>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted-foreground">Guests</label>
          <Input
            v-model.number="guests"
            type="number"
            :min="GUESTS_CONFIG.min"
            :max="GUESTS_CONFIG.max"
            class="w-20"
            :aria-invalid="!!errors.guests"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted-foreground">Budget</label>
          <Input
            v-model.number="budget"
            type="number"
            :min="BUDGET_CONFIG.min"
            :max="BUDGET_CONFIG.max"
            :step="BUDGET_CONFIG.step"
            class="w-24"
            :aria-invalid="!!errors.budget"
          />
        </div>

        <Button type="submit" size="icon" class="self-end" :disabled="props.disabled">
          <Search class="h-4 w-4" />
        </Button>
        </div>
      </form>

      <div v-if="Object.values(errors).some(e => e)" class="mt-2 text-xs text-destructive">
        {{ Object.values(errors).find(e => e) }}
      </div>
    </Tabs>
  </div>
</template>
