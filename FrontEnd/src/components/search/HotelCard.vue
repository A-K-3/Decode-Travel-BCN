<script setup lang="ts">
import { computed } from 'vue'
import { Star, MapPin, Bed, UtensilsCrossed, Wifi, AlertCircle } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RoomResult } from '@/types'

interface Props {
  room: RoomResult
}

const props = defineProps<Props>()

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: props.room.totalPrice.currency
  }).format(props.room.totalPrice.amount)
})

const starsArray = computed(() => Array.from({ length: props.room.hotel.stars }, (_, i) => i + 1))

const bedsDescription = computed(() => {
  return props.room.beds.map(bed => {
    const bedType = bed.type.toLowerCase().replace('_', ' ')
    return `${bed.count} ${bedType}`
  }).join(', ')
})

const includedServices = computed(() => {
  return props.room.services.filter(s => s.type === 'SERVICE_AVAILABILITY_TYPE_INCLUDED')
})

const hasWifi = computed(() => {
  return props.room.services.some(s => s.code === 'WIFI')
})

const isLowAvailability = computed(() => {
  return props.room.remainingUnits <= 5
})
</script>

<template>
  <Card
    class="overflow-hidden"
    :data-stars="room.hotel.stars"
    :data-city="room.hotel.location.city"
    :data-price="room.totalPrice.amount"
    :data-meal-plan="room.mealPlan"
  >
    <CardContent class="flex items-center justify-between !py-0 !px-4 gap-4">
      <!-- Left: Hotel & Room Info -->
      <div class="flex-1 min-w-0">
        <!-- Hotel Name, Stars & Location in one line -->
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <h3 class="font-semibold text-base">{{ room.hotel.name }}</h3>
          <div class="flex items-center gap-0.5">
            <Star
              v-for="s in starsArray"
              :key="s"
              class="h-3 w-3 fill-yellow-400 text-yellow-400"
            />
          </div>
          <span class="text-muted-foreground text-xs">•</span>
          <div class="flex items-center gap-1 text-muted-foreground text-xs">
            <MapPin class="h-3 w-3" />
            {{ room.hotel.location.city }}
          </div>
        </div>

        <!-- Room Name & Beds in one line -->
        <div class="flex items-center gap-3 text-sm mb-1">
          <span class="font-medium">{{ room.roomName }}</span>
          <span class="text-muted-foreground text-xs">•</span>
          <div class="flex items-center gap-1 text-muted-foreground text-xs">
            <Bed class="h-3 w-3" />
            {{ bedsDescription }}
          </div>
        </div>

        <!-- Meal Plan, Services & Availability in one line -->
        <div class="flex items-center gap-3 text-xs flex-wrap">
          <div class="flex items-center gap-1 text-muted-foreground">
            <UtensilsCrossed class="h-3 w-3" />
            {{ room.mealPlanDescription }}
          </div>
          <div v-if="hasWifi" class="flex items-center gap-1 text-muted-foreground">
            <Wifi class="h-3 w-3" />
            WiFi
          </div>
          <div v-if="isLowAvailability" class="flex items-center gap-1 text-orange-600 font-medium">
            <AlertCircle class="h-3 w-3" />
            Only {{ room.remainingUnits }} left!
          </div>
        </div>
      </div>

      <!-- Right: Price & Action -->
      <div class="flex items-center gap-4 shrink-0">
        <div class="text-right">
          <div class="text-xl font-bold">{{ formattedPrice }}</div>
          <div class="text-xs text-muted-foreground">{{ room.nights }} night{{ room.nights > 1 ? 's' : '' }}</div>
        </div>
        <Button size="sm" class="shrink-0">Book Now</Button>
      </div>
    </CardContent>
  </Card>
</template>
