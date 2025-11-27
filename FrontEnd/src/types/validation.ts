export interface ValidationErrors {
  origin: string
  destination: string
  dates: string
  budget: string
  guests: string
  extraInfo: string
}

export interface DateRangeData {
  startDate: string | null
  endDate: string | null
  nights: number
}

export interface FormData {
  activeTab: 'hotel' | 'flights' | 'hotel+flights'
  origin: string
  destination: string
  flightDateType: 'single' | 'range'
  singleFlightDate: string | null
  dateRangeData: DateRangeData
  budget: number
  guests: number
  extraInfo: string
}

