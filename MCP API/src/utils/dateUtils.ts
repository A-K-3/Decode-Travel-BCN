import { create } from '@bufbuild/protobuf';
import { DateSchema, type Date as ProtoDate } from '../../gen/cmp/types/v4/date_pb.js';

/**
 * Parse a YYYY-MM-DD string into a protobuf Date message
 */
export function parseDate(dateStr: string): ProtoDate {
  const [year, month, day] = dateStr.split('-').map(Number);
  return create(DateSchema, { year, month, day });
}

/**
 * Calculate the number of nights between two protobuf Date objects
 */
export function calculateNights(startDate: ProtoDate, endDate: ProtoDate): number {
  const start = new globalThis.Date(startDate.year, startDate.month - 1, startDate.day);
  const end = new globalThis.Date(endDate.year, endDate.month - 1, endDate.day);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate age from a protobuf Date birthdate
 */
export function calculateAge(birthdate: ProtoDate): number {
  const today = new globalThis.Date();
  const birth = new globalThis.Date(birthdate.year, birthdate.month - 1, birthdate.day);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate an approximate birthdate from an age (for children)
 * Uses today's date and subtracts the age in years
 */
export function birthdateFromAge(age: number): ProtoDate {
  const today = new globalThis.Date();
  const birthYear = today.getFullYear() - age;
  return create(DateSchema, {
    year: birthYear,
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
}

/**
 * Validate that a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Validate that checkOut is after checkIn
 */
export function isValidDateRange(checkIn: string, checkOut: string): boolean {
  const startDate = new globalThis.Date(checkIn);
  const endDate = new globalThis.Date(checkOut);
  return endDate > startDate;
}
