<script setup lang="ts">
import { reactive } from 'vue'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Star, Plane, Hotel, Clock, ArrowUpDown } from 'lucide-vue-next'

export interface StarFilters {
  1: boolean
  2: boolean
  3: boolean
  4: boolean
  5: boolean
}

interface Props {
  searchType: 'hotel' | 'flights' | 'hotel+flights'
}

defineProps<Props>()

const sortBy = defineModel<string>('sortBy', { default: 'default' })
const starFilters = defineModel<StarFilters>('starFilters', {
  default: () => ({ 1: true, 2: true, 3: true, 4: true, 5: true })
})

const flightFilters = reactive({
  noStopover: false,
  departureTime: {
    morning: false,
    afternoon: false,
    evening: false,
    night: false
  },
  cabinClass: {
    economy: false,
    business: false,
    first: false
  }
})
</script>

<template>
  <aside class="w-64 shrink-0 space-y-6">
    <div class="sticky top-24 space-y-6">
      <!-- Sort By -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <ArrowUpDown class="h-4 w-4" />
          <h3 class="font-semibold">Sort By</h3>
        </div>
        <NativeSelect v-model="sortBy" class="w-full">
          <NativeSelectOption value="default">Recommended</NativeSelectOption>
          <NativeSelectOption value="price-asc">Price: Low to High</NativeSelectOption>
          <NativeSelectOption value="price-desc">Price: High to Low</NativeSelectOption>
        </NativeSelect>
      </div>

      <Separator />

      <!-- Hotel Filters -->
      <template v-if="searchType === 'hotel' || searchType === 'hotel+flights'">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Hotel class="h-4 w-4" />
            <h3 class="font-semibold">Hotel Filters</h3>
          </div>

          <!-- Star Rating -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Star Rating</Label>
            <div class="space-y-2">
              <div
                v-for="star in 5"
                :key="star"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`star-${star}`"
                  v-model:checked="starFilters[star as keyof StarFilters]"
                />
                <Label :for="`star-${star}`" class="flex items-center gap-1 cursor-pointer font-normal">
                  <Star
                    v-for="s in star"
                    :key="s"
                    class="h-3 w-3 fill-yellow-400 text-yellow-400"
                  />
                </Label>
              </div>
            </div>
          </div>
        </div>

        <Separator v-if="searchType === 'hotel+flights'" class="my-6" />
      </template>

      <!-- Flight Filters -->
      <template v-if="searchType === 'flights' || searchType === 'hotel+flights'">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Plane class="h-4 w-4" />
            <h3 class="font-semibold">Flight Filters</h3>
          </div>

          <!-- Stopover -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Stops</Label>
            <div class="flex items-center space-x-2">
              <Checkbox id="no-stopover" v-model:checked="flightFilters.noStopover" />
              <Label for="no-stopover" class="cursor-pointer font-normal">
                Direct flights only
              </Label>
            </div>
          </div>

          <!-- Departure Time -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Departure Time</Label>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox id="morning" v-model:checked="flightFilters.departureTime.morning" />
                <Label for="morning" class="flex items-center gap-2 cursor-pointer font-normal">
                  <Clock class="h-3 w-3" />
                  Morning (6:00 - 12:00)
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox id="afternoon" v-model:checked="flightFilters.departureTime.afternoon" />
                <Label for="afternoon" class="flex items-center gap-2 cursor-pointer font-normal">
                  <Clock class="h-3 w-3" />
                  Afternoon (12:00 - 18:00)
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox id="evening" v-model:checked="flightFilters.departureTime.evening" />
                <Label for="evening" class="flex items-center gap-2 cursor-pointer font-normal">
                  <Clock class="h-3 w-3" />
                  Evening (18:00 - 24:00)
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox id="night" v-model:checked="flightFilters.departureTime.night" />
                <Label for="night" class="flex items-center gap-2 cursor-pointer font-normal">
                  <Clock class="h-3 w-3" />
                  Night (0:00 - 6:00)
                </Label>
              </div>
            </div>
          </div>

          <!-- Cabin Class -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Cabin Class</Label>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox id="economy" v-model:checked="flightFilters.cabinClass.economy" />
                <Label for="economy" class="cursor-pointer font-normal">Economy</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox id="business" v-model:checked="flightFilters.cabinClass.business" />
                <Label for="business" class="cursor-pointer font-normal">Business</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox id="first" v-model:checked="flightFilters.cabinClass.first" />
                <Label for="first" class="cursor-pointer font-normal">First Class</Label>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>
