import { reactive, toRefs } from 'vue'
import type { DateRangeData } from '@/types'
import { BUDGET_CONFIG, GUESTS_CONFIG } from '@/constants/search'

interface SearchState {
  activeTab: 'hotel' | 'flights' | 'hotel+flights'
  origin: string
  destination: string
  dateRangeValue: string[] | null
  dateRangeData: DateRangeData
  flightDateType: 'single' | 'range'
  singleFlightDate: string | null
  budget: number
  guests: number
  extraInfo: string
  chatMessage: string
  searchMode: 'assistant' | 'classic'
  generatedPrompt: string
}

const state = reactive<SearchState>({
  activeTab: 'hotel',
  origin: '',
  destination: '',
  dateRangeValue: null,
  dateRangeData: {
    startDate: null,
    endDate: null,
    nights: 0
  },
  flightDateType: 'single',
  singleFlightDate: null,
  budget: BUDGET_CONFIG.default,
  guests: GUESTS_CONFIG.default,
  extraInfo: '',
  chatMessage: '',
  searchMode: 'assistant',
  generatedPrompt: ''
})

export function useSearchStore() {
  const setSearchData = (data: Partial<SearchState>) => {
    Object.assign(state, data)
  }

  const resetForm = () => {
    state.origin = ''
    state.destination = ''
    state.dateRangeValue = null
    state.dateRangeData = {
      startDate: null,
      endDate: null,
      nights: 0
    }
    state.flightDateType = 'single'
    state.singleFlightDate = null
    state.budget = BUDGET_CONFIG.default
    state.guests = GUESTS_CONFIG.default
    state.extraInfo = ''
    state.chatMessage = ''
  }

  const getFormData = () => ({
    activeTab: state.activeTab,
    origin: state.origin,
    destination: state.destination,
    flightDateType: state.flightDateType,
    singleFlightDate: state.singleFlightDate,
    dateRangeData: state.dateRangeData,
    budget: state.budget,
    guests: state.guests,
    extraInfo: state.extraInfo
  })

  return {
    ...toRefs(state),
    setSearchData,
    resetForm,
    getFormData
  }
}
