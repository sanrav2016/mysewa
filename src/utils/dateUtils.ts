/**
 * Date utility functions for consistent local timezone handling
 */
import { format } from 'date-fns';

/**
 * Convert a UTC date string to local Date object
 * @param utcDateString - UTC date string from backend
 * @returns Local Date object
 */
export function utcToLocal(utcDateString: string | null | undefined): Date | null {
  if (!utcDateString) return null;
  return new Date(utcDateString);
}

/**
 * Convert a local Date object to UTC ISO string for backend
 * @param localDate - Local Date object
 * @returns UTC ISO string
 */
export function localToUTC(localDate: Date | null | undefined): string | null {
  if (!localDate) return null;
  return localDate.toISOString();
}

/**
 * Format a date for datetime-local input (YYYY-MM-DDTHH:mm)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatForDateTimeLocal(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get local time components
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get current local time
 * @returns Current local Date object
 */
export function getCurrentLocalTime(): Date {
  return new Date();
}

/**
 * Convert local datetime string to UTC for backend submission
 * @param localDateTime - Local datetime string (e.g., from datetime-local input)
 * @returns UTC ISO string
 */
export function localDateTimeToUTC(localDateTime: string | null | undefined): string | null {
  if (!localDateTime) return null;
  
  // Create a date object from the local datetime string
  const localDate = new Date(localDateTime);
  
  // Convert to UTC ISO string
  return localDate.toISOString();
}

/**
 * Format a date for display in user's local timezone
 * @param date - Date to format (can be UTC string or Date object)
 * @param formatStr - Format string for date-fns
 * @returns Formatted date string
 */
export function formatLocalDate(date: Date | string | null | undefined, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use date-fns format function
  return format(dateObj, formatStr);
}

/**
 * Get user's timezone offset in minutes
 * @returns Timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPastDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
} 