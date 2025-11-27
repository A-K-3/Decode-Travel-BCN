import type { SearchTab, BudgetConfig, GuestsConfig, ValidationRules, ErrorMessages } from '@/types'

export const SEARCH_TABS: SearchTab[] = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'flights', label: 'Flights' },
  { id: 'hotel+flights', label: 'Hotel + Flights' }
]

export const BUDGET_CONFIG: BudgetConfig = {
  min: 0,
  max: 5000,
  step: 100,
  default: 2500
}

export const GUESTS_CONFIG: GuestsConfig = {
  min: 1,
  max: 10,
  default: 1
}

export const VALIDATION_RULES: ValidationRules = {
  minLocationChars: 4,
  maxNights: 20,
  minNights: 1,
  maxExtraInfoChars: 200
}

export const ERROR_MESSAGES: ErrorMessages = {
  origin: {
    required: 'Origin is required',
    minLength: `Origin must be at least ${VALIDATION_RULES.minLocationChars} characters`
  },
  destination: {
    required: 'Destination is required',
    minLength: `Destination must be at least ${VALIDATION_RULES.minLocationChars} characters`
  },
  dates: {
    required: 'Please select both dates',
    flightRequired: 'Flight date is required',
    pastDate: 'Dates cannot be in the past',
    flightPastDate: 'Flight date cannot be in the past',
    minNights: `Please select at least ${VALIDATION_RULES.minNights} night`,
    maxNights: `Maximum stay is ${VALIDATION_RULES.maxNights} nights`
  },
  budget: {
    required: 'Budget is required',
    min: `Budget must be at least ${BUDGET_CONFIG.min}`,
    max: `Budget cannot exceed ${BUDGET_CONFIG.max}`
  },
  guests: {
    required: 'Number of guests is required',
    min: `At least ${GUESTS_CONFIG.min} guest is required`,
    max: `Maximum ${GUESTS_CONFIG.max} guests allowed`
  }
}
