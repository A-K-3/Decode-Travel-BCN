/**
 * Location Codes for Camino Messenger API
 * City codes (3-letter) and Country codes (ISO 3166-1 alpha-2)
 */

/**
 * Supported city codes
 */
export enum CityCode {
  // Spain
  MAD = "MAD", // Madrid
  BCN = "BCN", // Barcelona
  PMI = "PMI", // Palma de Mallorca
  MAL = "MAL", // Marbella
  IBZ = "IBZ", // Ibiza
  SEV = "SEV", // Sevilla
  VAL = "VAL", // Valencia
  GRA = "GRA", // Granada
  BIL = "BIL", // Bilbao

  // France
  PAR = "PAR", // Paris
  NIC = "NIC", // Nice
  CAN = "CAN", // Cannes
  LYO = "LYO", // Lyon
  MRS = "MRS", // Marseille
  BOR = "BOR", // Bordeaux
  STR = "STR", // Strasbourg
  MON = "MON", // Monaco

  // Italy
  ROM = "ROM", // Rome
  MIL = "MIL", // Milan
  VEN = "VEN", // Venice
  FLO = "FLO", // Florence
  NAP = "NAP", // Naples
  AMF = "AMF", // Amalfi
  CAP = "CAP", // Capri

  // Germany
  BER = "BER", // Berlin
  MUN = "MUN", // Munich
  FRA = "FRA", // Frankfurt
  HAM = "HAM", // Hamburg
  DUS = "DUS", // Dusseldorf

  // United Kingdom
  LON = "LON", // London
  EDI = "EDI", // Edinburgh
  MAN = "MAN", // Manchester
  BIR = "BIR", // Birmingham
  LIV = "LIV", // Liverpool

  // Portugal
  LIS = "LIS", // Lisbon
  POR = "POR", // Porto
  ALG = "ALG", // Algarve
  FNC = "FNC", // Madeira (Funchal)

  // Greece
  ATH = "ATH", // Athens
  SAN = "SAN", // Santorini
  MYK = "MYK", // Mykonos
  CRE = "CRE", // Crete

  // Switzerland
  ZUR = "ZUR", // Zurich
  GEN = "GEN", // Geneva
  ZER = "ZER", // Zermatt
  INT = "INT", // Interlaken

  // Austria
  VIE = "VIE", // Vienna
  SAL = "SAL", // Salzburg
  INS = "INS", // Innsbruck

  // Netherlands
  AMS = "AMS", // Amsterdam
  ROT = "ROT", // Rotterdam

  // Belgium
  BRU = "BRU", // Brussels
  BRG = "BRG", // Bruges

  // Turkey
  IST = "IST", // Istanbul
  ANT = "ANT", // Antalya
  BOD = "BOD", // Bodrum

  // United States
  NYC = "NYC", // New York
  MIA = "MIA", // Miami
  LAX = "LAX", // Los Angeles
  LAS = "LAS", // Las Vegas
  SFO = "SFO", // San Francisco

  // Mexico
  CUN = "CUN", // Cancun
  RIV = "RIV", // Riviera Maya
  CDM = "CDM", // Mexico City
  CAB = "CAB", // Los Cabos

  // Caribbean
  PUJ = "PUJ", // Punta Cana
  MBJ = "MBJ", // Montego Bay
  BGI = "BGI", // Barbados
  AUA = "AUA", // Aruba

  // Asia
  BKK = "BKK", // Bangkok
  PHU = "PHU", // Phuket
  SIN = "SIN", // Singapore
  TYO = "TYO", // Tokyo
  DPS = "DPS", // Bali (Denpasar)
  MLE = "MLE", // Maldives (Male)

  // Emirates
  DXB = "DXB", // Dubai
  AUH = "AUH", // Abu Dhabi
}

/**
 * Country codes (ISO 3166-1 alpha-2)
 */
export enum CountryCode {
  ES = "ES", // Spain
  FR = "FR", // France
  IT = "IT", // Italy
  DE = "DE", // Germany
  GB = "GB", // United Kingdom
  PT = "PT", // Portugal
  GR = "GR", // Greece
  CH = "CH", // Switzerland
  AT = "AT", // Austria
  NL = "NL", // Netherlands
  BE = "BE", // Belgium
  TR = "TR", // Turkey
  US = "US", // United States
  MX = "MX", // Mexico
  DO = "DO", // Dominican Republic
  JM = "JM", // Jamaica
  BB = "BB", // Barbados
  AW = "AW", // Aruba
  TH = "TH", // Thailand
  SG = "SG", // Singapore
  JP = "JP", // Japan
  ID = "ID", // Indonesia
  MV = "MV", // Maldives
  AE = "AE", // United Arab Emirates
  MC = "MC", // Monaco
}

/**
 * City to country mapping
 */
export const CITY_TO_COUNTRY: Record<CityCode, CountryCode> = {
  // Spain
  [CityCode.MAD]: CountryCode.ES,
  [CityCode.BCN]: CountryCode.ES,
  [CityCode.PMI]: CountryCode.ES,
  [CityCode.MAL]: CountryCode.ES,
  [CityCode.IBZ]: CountryCode.ES,
  [CityCode.SEV]: CountryCode.ES,
  [CityCode.VAL]: CountryCode.ES,
  [CityCode.GRA]: CountryCode.ES,
  [CityCode.BIL]: CountryCode.ES,

  // France
  [CityCode.PAR]: CountryCode.FR,
  [CityCode.NIC]: CountryCode.FR,
  [CityCode.CAN]: CountryCode.FR,
  [CityCode.LYO]: CountryCode.FR,
  [CityCode.MRS]: CountryCode.FR,
  [CityCode.BOR]: CountryCode.FR,
  [CityCode.STR]: CountryCode.FR,
  [CityCode.MON]: CountryCode.MC,

  // Italy
  [CityCode.ROM]: CountryCode.IT,
  [CityCode.MIL]: CountryCode.IT,
  [CityCode.VEN]: CountryCode.IT,
  [CityCode.FLO]: CountryCode.IT,
  [CityCode.NAP]: CountryCode.IT,
  [CityCode.AMF]: CountryCode.IT,
  [CityCode.CAP]: CountryCode.IT,

  // Germany
  [CityCode.BER]: CountryCode.DE,
  [CityCode.MUN]: CountryCode.DE,
  [CityCode.FRA]: CountryCode.DE,
  [CityCode.HAM]: CountryCode.DE,
  [CityCode.DUS]: CountryCode.DE,

  // United Kingdom
  [CityCode.LON]: CountryCode.GB,
  [CityCode.EDI]: CountryCode.GB,
  [CityCode.MAN]: CountryCode.GB,
  [CityCode.BIR]: CountryCode.GB,
  [CityCode.LIV]: CountryCode.GB,

  // Portugal
  [CityCode.LIS]: CountryCode.PT,
  [CityCode.POR]: CountryCode.PT,
  [CityCode.ALG]: CountryCode.PT,
  [CityCode.FNC]: CountryCode.PT,

  // Greece
  [CityCode.ATH]: CountryCode.GR,
  [CityCode.SAN]: CountryCode.GR,
  [CityCode.MYK]: CountryCode.GR,
  [CityCode.CRE]: CountryCode.GR,

  // Switzerland
  [CityCode.ZUR]: CountryCode.CH,
  [CityCode.GEN]: CountryCode.CH,
  [CityCode.ZER]: CountryCode.CH,
  [CityCode.INT]: CountryCode.CH,

  // Austria
  [CityCode.VIE]: CountryCode.AT,
  [CityCode.SAL]: CountryCode.AT,
  [CityCode.INS]: CountryCode.AT,

  // Netherlands
  [CityCode.AMS]: CountryCode.NL,
  [CityCode.ROT]: CountryCode.NL,

  // Belgium
  [CityCode.BRU]: CountryCode.BE,
  [CityCode.BRG]: CountryCode.BE,

  // Turkey
  [CityCode.IST]: CountryCode.TR,
  [CityCode.ANT]: CountryCode.TR,
  [CityCode.BOD]: CountryCode.TR,

  // United States
  [CityCode.NYC]: CountryCode.US,
  [CityCode.MIA]: CountryCode.US,
  [CityCode.LAX]: CountryCode.US,
  [CityCode.LAS]: CountryCode.US,
  [CityCode.SFO]: CountryCode.US,

  // Mexico
  [CityCode.CUN]: CountryCode.MX,
  [CityCode.RIV]: CountryCode.MX,
  [CityCode.CDM]: CountryCode.MX,
  [CityCode.CAB]: CountryCode.MX,

  // Caribbean
  [CityCode.PUJ]: CountryCode.DO,
  [CityCode.MBJ]: CountryCode.JM,
  [CityCode.BGI]: CountryCode.BB,
  [CityCode.AUA]: CountryCode.AW,

  // Asia
  [CityCode.BKK]: CountryCode.TH,
  [CityCode.PHU]: CountryCode.TH,
  [CityCode.SIN]: CountryCode.SG,
  [CityCode.TYO]: CountryCode.JP,
  [CityCode.DPS]: CountryCode.ID,
  [CityCode.MLE]: CountryCode.MV,

  // Emirates
  [CityCode.DXB]: CountryCode.AE,
  [CityCode.AUH]: CountryCode.AE,
};

/**
 * City name to code mapping (supports multiple languages)
 */
export const CITY_NAME_TO_CODE: Record<string, CityCode> = {
  // Spain
  'madrid': CityCode.MAD,
  'barcelona': CityCode.BCN,
  'mallorca': CityCode.PMI,
  'palma': CityCode.PMI,
  'palma de mallorca': CityCode.PMI,
  'marbella': CityCode.MAL,
  'ibiza': CityCode.IBZ,
  'sevilla': CityCode.SEV,
  'seville': CityCode.SEV,
  'valencia': CityCode.VAL,
  'granada': CityCode.GRA,
  'bilbao': CityCode.BIL,

  // France
  'paris': CityCode.PAR,
  'parís': CityCode.PAR,
  'nice': CityCode.NIC,
  'niza': CityCode.NIC,
  'cannes': CityCode.CAN,
  'lyon': CityCode.LYO,
  'marseille': CityCode.MRS,
  'marsella': CityCode.MRS,
  'bordeaux': CityCode.BOR,
  'burdeos': CityCode.BOR,
  'strasbourg': CityCode.STR,
  'estrasburgo': CityCode.STR,
  'monaco': CityCode.MON,
  'mónaco': CityCode.MON,

  // Italy
  'rome': CityCode.ROM,
  'roma': CityCode.ROM,
  'milan': CityCode.MIL,
  'milán': CityCode.MIL,
  'milano': CityCode.MIL,
  'venice': CityCode.VEN,
  'venecia': CityCode.VEN,
  'venezia': CityCode.VEN,
  'florence': CityCode.FLO,
  'florencia': CityCode.FLO,
  'firenze': CityCode.FLO,
  'naples': CityCode.NAP,
  'nápoles': CityCode.NAP,
  'napoli': CityCode.NAP,
  'amalfi': CityCode.AMF,
  'capri': CityCode.CAP,

  // Germany
  'berlin': CityCode.BER,
  'berlín': CityCode.BER,
  'munich': CityCode.MUN,
  'múnich': CityCode.MUN,
  'münchen': CityCode.MUN,
  'frankfurt': CityCode.FRA,
  'hamburg': CityCode.HAM,
  'hamburgo': CityCode.HAM,
  'düsseldorf': CityCode.DUS,
  'dusseldorf': CityCode.DUS,

  // United Kingdom
  'london': CityCode.LON,
  'londres': CityCode.LON,
  'edinburgh': CityCode.EDI,
  'edimburgo': CityCode.EDI,
  'manchester': CityCode.MAN,
  'birmingham': CityCode.BIR,
  'liverpool': CityCode.LIV,

  // Portugal
  'lisbon': CityCode.LIS,
  'lisboa': CityCode.LIS,
  'porto': CityCode.POR,
  'oporto': CityCode.POR,
  'algarve': CityCode.ALG,
  'madeira': CityCode.FNC,
  'funchal': CityCode.FNC,

  // Greece
  'athens': CityCode.ATH,
  'atenas': CityCode.ATH,
  'santorini': CityCode.SAN,
  'mykonos': CityCode.MYK,
  'miconos': CityCode.MYK,
  'crete': CityCode.CRE,
  'creta': CityCode.CRE,

  // Switzerland
  'zurich': CityCode.ZUR,
  'zürich': CityCode.ZUR,
  'zúrich': CityCode.ZUR,
  'geneva': CityCode.GEN,
  'ginebra': CityCode.GEN,
  'genève': CityCode.GEN,
  'zermatt': CityCode.ZER,
  'interlaken': CityCode.INT,

  // Austria
  'vienna': CityCode.VIE,
  'viena': CityCode.VIE,
  'wien': CityCode.VIE,
  'salzburg': CityCode.SAL,
  'salzburgo': CityCode.SAL,
  'innsbruck': CityCode.INS,

  // Netherlands
  'amsterdam': CityCode.AMS,
  'ámsterdam': CityCode.AMS,
  'rotterdam': CityCode.ROT,
  'róterdam': CityCode.ROT,

  // Belgium
  'brussels': CityCode.BRU,
  'bruselas': CityCode.BRU,
  'bruxelles': CityCode.BRU,
  'bruges': CityCode.BRG,
  'brujas': CityCode.BRG,

  // Turkey
  'istanbul': CityCode.IST,
  'estambul': CityCode.IST,
  'antalya': CityCode.ANT,
  'bodrum': CityCode.BOD,

  // United States
  'new york': CityCode.NYC,
  'nueva york': CityCode.NYC,
  'nyc': CityCode.NYC,
  'miami': CityCode.MIA,
  'los angeles': CityCode.LAX,
  'la': CityCode.LAX,
  'las vegas': CityCode.LAS,
  'san francisco': CityCode.SFO,

  // Mexico
  'cancun': CityCode.CUN,
  'cancún': CityCode.CUN,
  'riviera maya': CityCode.RIV,
  'mexico city': CityCode.CDM,
  'ciudad de mexico': CityCode.CDM,
  'ciudad de méxico': CityCode.CDM,
  'los cabos': CityCode.CAB,
  'cabo san lucas': CityCode.CAB,

  // Caribbean
  'punta cana': CityCode.PUJ,
  'montego bay': CityCode.MBJ,
  'barbados': CityCode.BGI,
  'aruba': CityCode.AUA,

  // Asia
  'bangkok': CityCode.BKK,
  'phuket': CityCode.PHU,
  'singapore': CityCode.SIN,
  'singapur': CityCode.SIN,
  'tokyo': CityCode.TYO,
  'tokio': CityCode.TYO,
  'bali': CityCode.DPS,
  'maldives': CityCode.MLE,
  'maldivas': CityCode.MLE,

  // Emirates
  'dubai': CityCode.DXB,
  'dubái': CityCode.DXB,
  'abu dhabi': CityCode.AUH,
};

/**
 * Resolves a city name or code to a CityCode enum value
 * @param input City name (e.g., "Madrid", "París") or code (e.g., "MAD", "PAR")
 * @returns CityCode if found, null otherwise
 */
export function resolveCityCode(input: string): CityCode | null {
  const normalized = input.toLowerCase().trim();

  // First check if it's already a valid code
  const upperInput = normalized.toUpperCase();
  if (Object.values(CityCode).includes(upperInput as CityCode)) {
    return upperInput as CityCode;
  }

  // Look up in the name mapping
  return CITY_NAME_TO_CODE[normalized] || null;
}

/**
 * Gets the country code for a city
 * @param cityCode The city code
 * @returns CountryCode for the city
 */
export function getCountryForCity(cityCode: CityCode): CountryCode {
  return CITY_TO_COUNTRY[cityCode];
}
