<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'

interface Props {
  modelValue?: string[] | null
  error?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  error: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string[] | null]
  'update:range': [range: { startDate: string | null; endDate: string | null; nights: number }]
}>()

const open = ref(false)
const minDate = today(getLocalTimeZone())

// Convertir array de strings "dd/MM/yyyy" a objeto DateRange con CalendarDate
const dateRange = computed({
  get: () => {
    if (!props.modelValue || !props.modelValue[0] || !props.modelValue[1]) {
      return { start: undefined, end: undefined }
    }
    return {
      start: stringToCalendarDate(props.modelValue[0]),
      end: stringToCalendarDate(props.modelValue[1])
    }
  },
  set: (value) => {
    if (!value || !value.start || !value.end) {
      emit('update:modelValue', null)
      return
    }
    const formatted = [
      calendarDateToString(value.start),
      calendarDateToString(value.end)
    ]
    emit('update:modelValue', formatted)
  }
})

// Convertir string "dd/MM/yyyy" a CalendarDate
const stringToCalendarDate = (dateStr: string): CalendarDate | undefined => {
  if (!dateStr) return undefined
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    return new CalendarDate(year, month, day)
  }
  return undefined
}

// Convertir CalendarDate a string "dd/MM/yyyy"
const calendarDateToString = (calendarDate: CalendarDate): string | null => {
  if (!calendarDate) return null
  const day = String(calendarDate.day).padStart(2, '0')
  const month = String(calendarDate.month).padStart(2, '0')
  const year = calendarDate.year
  return `${day}/${month}/${year}`
}

const numberOfNights = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) {
    return 0
  }

  const start = dateRange.value.start
  const end = dateRange.value.end

  // Convertir a timestamp para calcular diferencia
  const startDate = new Date(start.year, start.month - 1, start.day)
  const endDate = new Date(end.year, end.month - 1, end.day)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const formattedDateRange = computed(() => {
  const df = new DateFormatter('en-GB', { dateStyle: 'medium' })

  if (!dateRange.value.start) {
    return 'Check-in — Check-out'
  }

  if (!dateRange.value.end) {
    return df.format(dateRange.value.start.toDate(getLocalTimeZone()))
  }

  return `${df.format(dateRange.value.start.toDate(getLocalTimeZone()))} — ${df.format(dateRange.value.end.toDate(getLocalTimeZone()))}`
})

watch(dateRange, (newValue) => {
  emit('update:range', {
    startDate: newValue.start ? calendarDateToString(newValue.start) : null,
    endDate: newValue.end ? calendarDateToString(newValue.end) : null,
    nights: numberOfNights.value
  })
}, { deep: true })

// Cerrar popover cuando se selecciona rango completo
watch(numberOfNights, (nights) => {
  if (nights > 0) {
    open.value = false
  }
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal',
          !dateRange.start && 'text-muted-foreground',
          error && 'border-destructive'
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ formattedDateRange }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <RangeCalendar
        v-model="dateRange"
        :number-of-months="2"
        :min-value="minDate"
      />
    </PopoverContent>
  </Popover>
</template>
