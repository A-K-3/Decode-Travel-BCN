<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="overflow-hidden">
    <CardContent class="flex items-center justify-between !py-4 !px-4">
      <div class="flex-1 space-y-3">
        <!-- Hotel name -->
        <Skeleton class="h-6 w-48" />

        <!-- Location -->
        <Skeleton class="h-4 w-32" />

        <!-- Stars -->
        <div class="flex gap-1">
          <Skeleton class="h-3 w-3 rounded-full" />
          <Skeleton class="h-3 w-3 rounded-full" />
          <Skeleton class="h-3 w-3 rounded-full" />
          <Skeleton class="h-3 w-3 rounded-full" />
        </div>

        <!-- Room name -->
        <Skeleton class="h-4 w-40" />
      </div>

      <div class="flex flex-col items-end justify-center pl-4 border-l space-y-2">
        <!-- Price -->
        <Skeleton class="h-8 w-24" />
        <!-- Total label -->
        <Skeleton class="h-3 w-12" />
        <!-- Button -->
        <Skeleton class="h-8 w-24 mt-1" />
      </div>
    </CardContent>
  </Card>
</template>
