<script setup lang="ts">
import { Plane, Clock } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  airline: string
  airlineLogo: string
  departureTime: string
  arrivalTime: string
  departureAirport: string
  arrivalAirport: string
  duration: string
  stops: number
  price: number
  cabinClass: string
}

defineProps<Props>()
</script>

<template>
  <Card class="overflow-hidden">
    <CardContent class="!py-0 !px-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <img v-if="airlineLogo" :src="airlineLogo" :alt="airline" class="w-8 h-8 object-contain" />
            <Plane v-else class="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div class="font-medium">{{ airline }}</div>
            <Badge variant="outline" class="text-xs">{{ cabinClass }}</Badge>
          </div>
        </div>

        <div class="flex items-center gap-8">
          <div class="text-center">
            <div class="text-xl font-bold">{{ departureTime }}</div>
            <div class="text-sm text-muted-foreground">{{ departureAirport }}</div>
          </div>

          <div class="flex flex-col items-center gap-1">
            <div class="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock class="h-3 w-3" />
              {{ duration }}
            </div>
            <div class="w-24 h-px bg-border relative">
              <Plane class="h-3 w-3 absolute -top-1.5 left-1/2 -translate-x-1/2 text-muted-foreground" />
            </div>
            <div class="text-xs text-muted-foreground">
              {{ stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}` }}
            </div>
          </div>

          <div class="text-center">
            <div class="text-xl font-bold">{{ arrivalTime }}</div>
            <div class="text-sm text-muted-foreground">{{ arrivalAirport }}</div>
          </div>
        </div>

        <div class="text-right">
          <div class="text-2xl font-bold">{{ price }}€</div>
          <div class="text-xs text-muted-foreground">per person</div>
          <Button size="sm" class="mt-2">Select</Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
