/**
 * Hotel API Response Types
 * These interfaces match the structure returned by the hotel search API
 */

export interface HotelLocation {
  city: string
  region: string | null
  country: string
  address: string | null
  postalCode: string | null
  coordinates: unknown | null
}

export interface HotelInfo {
  code: string
  name: string
  stars: number
  chain: string | null
  location: HotelLocation
  contact: unknown | null
}

export interface PriceAmount {
  amount: number
  currency: string
}

export interface BedInfo {
  type: string
  count: number
}

export interface ServiceInfo {
  code: string
  description: string
  type: string
}

export interface CancellationPenalty {
  from: string
  to: string
  amount: number
  currency: string
}

export interface RoomResult {
  resultId: string
  hotelCode: string
  hotel: HotelInfo
  roomCode: string
  roomName: string
  originalRoomName: string
  totalPrice: PriceAmount
  nights: number
  pricePerNight: number
  refundable: boolean
  cancellationDeadline: string | null
  cancellationPenalties: CancellationPenalty[]
  bookability: string
  mealPlan: string
  mealPlanDescription: string
  beds: BedInfo[]
  remainingUnits: number
  services: ServiceInfo[]
}

export interface HotelSearchResponse {
  sessionId: string
  response: {
    success: boolean
    searchId: string
    expiresAt: string | null
    resultsCount: number
    results: RoomResult[]
  }
}

/**
 * Props interface for HotelCard component
 */
export interface HotelCardProps {
  room: RoomResult
}
