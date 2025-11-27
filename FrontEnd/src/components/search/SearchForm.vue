<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import BudgetSlider from '@/components/common/BudgetSlider.vue'
import GuestInput from '@/components/common/GuestInput.vue'
import LocationInput from '@/components/common/LocationInput.vue'
import ExtraInfoInput from '@/components/common/ExtraInfoInput.vue'
import FlightDatePicker from '@/components/search/FlightDatePicker.vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import { useSearchStore } from '@/composables/useSearchStore'
import { useSearchValidation } from '@/composables/useSearchValidation'
import { usePromptGenerator } from '@/composables/usePromptGenerator'
import { SEARCH_TABS } from '@/constants/search'
import type { DateRangeData } from '@/types'

const router = useRouter()

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
  extraInfo,
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
  setSearchData({ searchMode: 'classic', generatedPrompt: prompt })
  router.push('/search-results')
}

const getSubmitButtonText = (): string => {
  if (activeTab.value === 'hotel') return 'Search Hotels'
  if (activeTab.value === 'flights') return 'Search Flights'
  return 'Search Hotels + Flights'
}

watch(activeTab, () => {
  clearErrors()
})

watch(flightDateType, () => {
  clearError('dates')
})
</script>

<template>
  <Tabs v-model="activeTab" class="w-full">
    <TabsList class="grid w-full grid-cols-3 mb-6">
      <TabsTrigger
        v-for="tab in SEARCH_TABS"
        :key="tab.id"
        :value="tab.id"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div :class="activeTab !== 'hotel' ? 'grid grid-cols-2 gap-4' : ''">
        <LocationInput
          v-if="activeTab !== 'hotel'"
          id="origin"
          v-model="origin"
          :error="errors.origin"
          label="Origin"
          placeholder="Where are you from?"
        />

        <LocationInput
          id="destination"
          v-model="destination"
          :error="errors.destination"
          label="Destination"
          placeholder="Where are you going?"
        />
      </div>

      <div v-if="activeTab !== 'flights'" class="space-y-2">
        <Label>Dates</Label>
        <DateRangePicker
          v-model="dateRangeValue"
          :error="!!errors.dates"
          @update:range="handleRangeUpdate"
        />
        <p v-if="errors.dates" class="text-sm text-destructive">{{ errors.dates }}</p>
      </div>

      <FlightDatePicker
        v-if="activeTab === 'flights'"
        v-model:flightDateType="flightDateType"
        v-model:rangeValue="dateRangeValue"
        v-model:singleDate="singleFlightDate"
        :error="errors.dates"
        @update:range="handleRangeUpdate"
      />

      <div class="grid grid-cols-2 gap-4">
        <BudgetSlider
          v-model="budget"
          :error="errors.budget"
        />

        <GuestInput
          v-model="guests"
          :error="errors.guests"
        />
      </div>

      <ExtraInfoInput
        v-model="extraInfo"
        :error="errors.extraInfo"
      />

      <Button class="w-full" type="submit">
        {{ getSubmitButtonText() }}
      </Button>
    </form>
  </Tabs>
</template>

