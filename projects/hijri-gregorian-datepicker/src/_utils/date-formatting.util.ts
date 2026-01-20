import { CALENDAR_CONSTANTS, WEEKDAYS_EN } from '../_constants/calendar.constants';

export class DateFormattingUtil {
  // Formats a Date object to DD/MM/YYYY string
  static formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Parses a date string in DD/MM/YYYY format to Date object
  static parseDate(dateStr: string): Date | null {
    if (!dateStr) {
      return null;
    }

    const parts = dateStr.split('/');
    if (parts.length !== CALENDAR_CONSTANTS.DATE_PART_COUNT) {
      return null;
    }

    const [day, month, year] = parts.map(Number);
    if (!this.isValidDateParts(day, month, year)) {
      return null;
    }

    return new Date(year, month - 1, day);
  }


  // Gets the day shorthand for a date
  static getDayShortHand(date: Date): string {
    return date.toLocaleString('en-US', { weekday: 'short' });
  }


  // Gets day name from day index
  static getDayName(dayIndex: number): string {
    return WEEKDAYS_EN[dayIndex] || '';
  }


  // Builds a date string from day, month, year
  static buildDateString(day: number | string, month: number | string, year: number | string): string {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  }


  // Validates date parts
  private static isValidDateParts(day: number, month: number, year: number): boolean {
    return !isNaN(day) && !isNaN(month) && !isNaN(year) &&
      day >= 1 && day <= 31 &&
      month >= CALENDAR_CONSTANTS.MIN_MONTH_VALUE &&
      month <= CALENDAR_CONSTANTS.MAX_MONTH_VALUE &&
      year >= 1;
  }


  // Checks if a date is in the past, today, or future
  static compareDateToTarget(inputDate: string, targetDate: Date): 'Past' | 'Today' | 'Future' | null {
    if (!inputDate) return null;

    const parsedDate = this.parseDate(inputDate);
    if (!parsedDate) return null;

    const today = new Date(targetDate);
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate > today) {
      return 'Future';
    } else if (parsedDate < today) {
      return 'Past';
    } else {
      return 'Today';
    }
  }
}