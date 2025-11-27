<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import DateRangePicker from '@/components/DateRangePicker.vue'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'

interface Props {
  flightDateType?: 'single' | 'range'
  singleDate?: string | null
  rangeValue?: Array<string> | null
  error?: string
  hideRadio?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  flightDateType: 'single',
  singleDate: null,
  rangeValue: null,
  error: '',
  hideRadio: false
})

const emit = defineEmits<{
  'update:flightDateType': [value: 'single' | 'range']
  'update:singleDate': [value: string | null]
  'update:rangeValue': [value: Array<string> | null]
  'update:range': [range: { startDate: string | null; endDate: string | null; nights: number }]
}>()

const open = ref(false)
const minDate = today(getLocalTimeZone())

const dateType = computed({
  get: () => props.flightDateType,
  set: (val) => emit('update:flightDateType', val)
})

// Convertir string "dd/MM/yyyy" a CalendarDate para single date
const singleDateValue = computed({
  get: () => {
    if (!props.singleDate) return undefined
    const parts = props.singleDate.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      const year = parseInt(parts[2], 10)
      return new CalendarDate(year, month, day)
    }
    return undefined
  },
  set: (val) => {
    if (!val) {
      emit('update:singleDate', null)
      return
    }
    const day = String(val.day).padStart(2, '0')
    const month = String(val.month).padStart(2, '0')
    const year = val.year
    emit('update:singleDate', `${day}/${month}/${year}`)
  }
})

const dateRangeValue = computed({
  get: () => props.rangeValue,
  set: (val) => emit('update:rangeValue', val)
})

const formattedSingleDate = computed(() => {
  if (!singleDateValue.value) {
    return 'Select date'
  }
  const df = new DateFormatter('en-GB', { dateStyle: 'medium' })
  return df.format(singleDateValue.value.toDate(getLocalTimeZone()))
})

const handleRangeUpdate = (range: { startDate: string | null; endDate: string | null; nights: number }) => {
  emit('update:range', range)
}

// Cerrar popover cuando se selecciona fecha
watch(singleDateValue, (val) => {
  if (val) {
    open.value = false
  }
})
</script>

<template>
  <div :class="hideRadio ? '' : 'space-y-3'">
    <template v-if="!hideRadio">
      <Label>Flight Date</Label>

      <RadioGroup v-model="dateType" class="flex gap-4">
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="one-way" value="single" />
          <Label for="one-way" class="cursor-pointer font-normal">One way</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="round-trip" value="range" />
          <Label for="round-trip" class="cursor-pointer font-normal">Round trip</Label>
        </div>
      </RadioGroup>
    </template>

    <div v-if="flightDateType === 'single'">
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            :class="cn(
              'w-full justify-start text-left font-normal',
              !singleDateValue && 'text-muted-foreground',
              error && 'border-destructive'
            )"
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{ formattedSingleDate }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <Calendar
            v-model="singleDateValue"
            :min-value="minDate"
          />
        </PopoverContent>
      </Popover>
    </div>
    <div v-else>
      <DateRangePicker
        v-model="dateRangeValue"
        :error="!!error"
        @update:range="handleRangeUpdate"
      />
    </div>
    <p v-if="error && !hideRadio" class="text-sm text-destructive">{{ error }}</p>
  </div>
</template>

