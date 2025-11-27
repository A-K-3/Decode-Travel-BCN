<script setup lang="ts">
import { Star, MapPin, Plane, Clock, Bed } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { HotelInfo, PriceAmount } from '@/types'

interface FlightInfo {
  airline: string
  departureTime: string
  arrivalTime: string
  departureAirport: string
  arrivalAirport: string
  duration: string
  stops: number
  price: number
}

interface Props {
  flight: FlightInfo
  hotel: HotelInfo
  roomName: string
  roomPrice: PriceAmount
  totalPrice: string
}

defineProps<Props>()
</script>

<template>
  <Card
    class="overflow-hidden"
    :data-stars="hotel.stars"
    :data-city="hotel.location.city"
    :data-price="roomPrice.amount"
  >
    <CardContent class="!py-4 !px-4">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <!-- Flight Section -->
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
              <Plane class="h-5 w-5 text-muted-foreground" />
            </div>
            <div class="flex items-center gap-6 flex-1">
              <div class="text-center">
                <div class="font-bold">{{ flight.departureTime }}</div>
                <div class="text-xs text-muted-foreground">{{ flight.departureAirport }}</div>
              </div>
              <div class="flex flex-col items-center gap-0.5 flex-1">
                <div class="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock class="h-3 w-3" />
                  {{ flight.duration }}
                </div>
                <div class="w-full h-px bg-border relative">
                  <Plane class="h-3 w-3 absolute -top-1.5 left-1/2 -translate-x-1/2 text-muted-foreground" />
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}` }}
                </div>
              </div>
              <div class="text-center">
                <div class="font-bold">{{ flight.arrivalTime }}</div>
                <div class="text-xs text-muted-foreground">{{ flight.arrivalAirport }}</div>
              </div>
            </div>
            <div class="text-sm text-muted-foreground">{{ flight.airline }}</div>
          </div>

          <Separator class="my-3" />

          <!-- Hotel Section -->
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
              <MapPin class="h-5 w-5 text-muted-foreground" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold">{{ hotel.name }}</h3>
                <div class="flex items-center gap-0.5">
                  <Star
                    v-for="s in hotel.stars"
                    :key="s"
                    class="h-3 w-3 fill-yellow-400 text-yellow-400"
                  />
                </div>
              </div>
              <div class="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin class="h-3 w-3" />
                {{ hotel.location.city }}
              </div>
              <div class="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <Bed class="h-3 w-3" />
                {{ roomName }}
              </div>
            </div>
          </div>
        </div>

        <!-- Price Section -->
        <div class="flex flex-col items-end justify-center pl-4 ml-4 border-l min-w-[140px]">
          <Badge variant="outline" class="mb-2">Package Deal</Badge>
          <div class="text-2xl font-bold">{{ totalPrice }} {{ roomPrice.currency }}</div>
          <div class="text-xs text-muted-foreground">Total price</div>
          <Button size="sm" class="mt-3">View Package</Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
