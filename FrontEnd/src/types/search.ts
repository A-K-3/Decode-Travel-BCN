export interface SearchTab {
  id: 'hotel' | 'flights' | 'hotel+flights'
  label: string
}

export interface BudgetConfig {
  min: number
  max: number
  step: number
  default: number
}

export interface GuestsConfig {
  min: number
  max: number
  default: number
}

export interface ValidationRules {
  minLocationChars: number
  maxNights: number
  minNights: number
  maxExtraInfoChars: number
}

export interface ErrorMessages {
  origin: {
    required: string
    minLength: string
  }
  destination: {
    required: string
    minLength: string
  }
  dates: {
    required: string
    flightRequired: string
    pastDate: string
    flightPastDate: string
    minNights: string
    maxNights: string
  }
  budget: {
    required: string
    min: string
    max: string
  }
  guests: {
    required: string
    min: string
    max: string
  }
}

