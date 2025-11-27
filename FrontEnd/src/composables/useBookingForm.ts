import { ref } from 'vue'
import type { DateRangeData } from '@/types'
import { BUDGET_CONFIG, GUESTS_CONFIG } from '@/constants/search'

export function useBookingForm() {
    const activeTab = ref<'hotel' | 'flights' | 'hotel+flights'>('hotel')
    const origin = ref<string>('')
    const destination = ref<string>('')
    const dateRangeValue = ref<string[] | null>(null)
    const dateRangeData = ref<DateRangeData>({
        startDate: null,
        endDate: null,
        nights: 0
    })
    const flightDateType = ref<'single' | 'range'>('single')
    const singleFlightDate = ref<string | null>(null)
    const budget = ref<number>(BUDGET_CONFIG.default)
    const guests = ref<number>(GUESTS_CONFIG.default)
    const extraInfo = ref<string>('')

    const resetForm = (): void => {
        origin.value = ''
        destination.value = ''
        dateRangeValue.value = null
        dateRangeData.value = {
            startDate: null,
            endDate: null,
            nights: 0
        }
        flightDateType.value = 'single'
        singleFlightDate.value = null
        budget.value = BUDGET_CONFIG.default
        guests.value = GUESTS_CONFIG.default
        extraInfo.value = ''
    }

    const getFormData = () => ({
        activeTab: activeTab.value,
        origin: origin.value,
        destination: destination.value,
        flightDateType: flightDateType.value,
        singleFlightDate: singleFlightDate.value,
        dateRangeData: dateRangeData.value,
        budget: budget.value,
        guests: guests.value,
        extraInfo: extraInfo.value
    })

    return {
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
        resetForm,
        getFormData
    }
}