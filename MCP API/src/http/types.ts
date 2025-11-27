/**
 * REST API Types for Camino Messenger API
 * Based on APIEndpoints.md documentation
 */

// ============================================
// Hotel Types (GET /api/hotels)
// ============================================

export interface TransportHub {
  codigo: string;
  tipo: string;
  distanciaKm?: number;
  tiempoMinutos?: number;
}

export interface Hotel {
  codigo: string;
  nombre: string;
  cadena?: string;
  estrellas?: number;
  categoryUnit?: string;
  tipo?: string;
  ubicacion: {
    ciudad: string;
    region?: string;
    pais: string;
    direccion?: string;
    direccion2?: string;
    distrito?: string;
    codigoPostal?: string;
  };
  contacto: {
    telefono?: string;
    email?: string;
    website?: string;
  };
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
  transportHubs?: TransportHub[];
  status?: string;
  lastModified?: string;
}

export interface HotelsResponse {
  hotels: Hotel[];
  totalHotels: number;
  lastUpdated: string;
}

export interface HotelNotFoundError {
  error: string;
  code: string;
}

// ============================================
// Cache Info Types (GET /api/hotels/cache-info)
// ============================================

export interface CacheInfoResponse {
  totalHotels: number;
  lastUpdate: string | null;
  isLoading: boolean;
}

// ============================================
// Availability Types (POST /api/availability)
// ============================================

export interface AvailabilityRequest {
  startDate: string;
  endDate: string;
  adults: number;
  children?: number[];
  currency?: string;
  language?: string;
  propertyType?: string;
  cityCode: string;
  countryCode: string;
}

export interface RoomPrice {
  total: string;
  currency: string;
  perNight?: string;
}

export interface MealPlan {
  code: string;
  description: string;
}

export interface Bed {
  type: string;
  count: number;
}

export interface RoomService {
  code: string;
  description?: string;
  type?: string;
}

export interface CancellationPolicy {
  refundable: boolean;
  deadline?: string;
}

// Complex cancellation policy (from availability API)
export interface CancelPenalty {
  valid_for_rate_plans?: string[];
  datetime_range?: {
    start: { seconds: string; nanos: number };
    end: { seconds: string; nanos: number };
  };
  value?: {
    value: string;
    decimals: number;
    currency: { iso_currency: string };
  };
  description?: string;
}

export interface ComplexCancellationPolicy {
  complex_cancel_penalties?: {
    cancel_penalties: CancelPenalty[];
  };
  policy_type?: string;
}

// Hotel info embedded in Room (from availability API)
export interface RoomHotelLocation {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  city: string;
  region?: string;
  country: string;
  address?: string;
  address2?: string;
  district?: string;
  postalCode?: string;
}

export interface RoomHotelContact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface RoomHotel {
  code: string;
  name: string;
  stars?: number;
  categoryUnit?: string;
  location: RoomHotelLocation;
  contact?: RoomHotelContact;
  chain?: string;
  themes?: string[];
}

export interface Room {
  roomCode: string;
  roomName: string;
  originalRoomName?: string;
  hotelCode?: string;  // Deprecated, use hotel.code
  hotel?: RoomHotel;   // Full hotel info from availability API
  price: RoomPrice;
  mealPlan?: MealPlan;
  beds?: Bed[];
  remainingUnits?: number;
  services?: RoomService[];
  cancellationPolicy?: CancellationPolicy | ComplexCancellationPolicy;
}

export interface AvailabilityResponse {
  searchId: string;
  rooms: Room[];
  totalResults: number;
  filters: {
    startDate: string;
    endDate: string;
    adults: number;
    children?: number[];
    currency: string;
    location?: {
      code: string;
      type: string;
    };
  };
}

// ============================================
// Error Types
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  errors?: ValidationError[];
  details?: Array<{
    code: string;
    message: string;
    suggestion?: string;
  }>;
}

// ============================================
// Health Check Types (GET /health)
// ============================================

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  bot: string;
  environment: string;
}
