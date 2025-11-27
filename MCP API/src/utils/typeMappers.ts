import { IsoCurrency } from '../../gen/cmp/types/v4/currency_pb.js';
import { Language } from '../../gen/cmp/types/v1/language_pb.js';
import { Country } from '../../gen/cmp/types/v2/country_pb.js';
import { PropertyType } from '../../gen/cmp/services/accommodation/v4/property_types_pb.js';
import { TravellerType } from '../../gen/cmp/types/v4/traveller_pb.js';

// Default constants for search parameters
export const DEFAULT_CURRENCY = IsoCurrency.EUR;
export const DEFAULT_LANGUAGE = Language.EN;
export const DEFAULT_MARKET = Country.ES;
export const DEFAULT_NATIONALITY = Country.ES;

/**
 * Map property type string to PropertyType enum
 */
export function mapPropertyType(type: string): PropertyType {
  switch (type.toLowerCase()) {
    case 'holiday_home':
      return PropertyType.HOLIDAY_HOME;
    case 'hotel':
    default:
      return PropertyType.HOTEL;
  }
}

/**
 * Map traveller type string to TravellerType enum
 */
export function mapTravellerType(type: string): TravellerType {
  switch (type.toLowerCase()) {
    case 'adult':
      return TravellerType.ADULT;
    case 'child':
      return TravellerType.CHILD;
    case 'infant':
      return TravellerType.INFANT;
    case 'senior':
      return TravellerType.SENIOR;
    default:
      return TravellerType.ADULT;
  }
}

/**
 * Get TravellerType label for display
 */
export function getTravellerTypeLabel(type: TravellerType): string {
  switch (type) {
    case TravellerType.ADULT:
      return 'adult';
    case TravellerType.CHILD:
      return 'child';
    case TravellerType.INFANT:
      return 'infant';
    case TravellerType.SENIOR:
      return 'senior';
    default:
      return 'adult';
  }
}

/**
 * Get currency code string from IsoCurrency enum
 */
export function getCurrencyCode(currency: IsoCurrency): string {
  switch (currency) {
    case IsoCurrency.EUR:
      return 'EUR';
    case IsoCurrency.USD:
      return 'USD';
    case IsoCurrency.GBP:
      return 'GBP';
    default:
      return 'EUR';
  }
}
