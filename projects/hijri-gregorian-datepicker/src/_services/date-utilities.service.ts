import { Injectable } from '@angular/core';
import { DayInfo } from '../_interfaces/calendar.model';
import { DateFormattingUtil } from '../_utils/date-formatting.util';
import { UmmAlQuraCalendarUtil } from '../_utils/umm-al-qura-calendar.util';

@Injectable({
  providedIn: 'root',
})
export class DateUtilitiesService {
  private monthDataCache = new Map<string, DayInfo[]>();
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {}

  parseDate(dateStr: string): Date | null {
    return DateFormattingUtil.parseDate(dateStr);
  }

  formatDate(date: Date): string {
    return DateFormattingUtil.formatDate(date);
  }

  private getDayShortHand(date: Date): string {
    return DateFormattingUtil.getDayShortHand(date);
  }

  private generateDatesForHijriMonth(hijriYear: number, hijriMonth: number): DayInfo[] {
    const daysInMonth = UmmAlQuraCalendarUtil.getDaysInMonth(hijriYear, hijriMonth);
    const monthArray: DayInfo[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const gregorianDate = UmmAlQuraCalendarUtil.hijriToGregorian(hijriYear, hijriMonth, day);
      
      monthArray.push({
        gD: this.formatDate(gregorianDate),
        uD: `${day.toString().padStart(2, '0')}/${hijriMonth.toString().padStart(2, '0')}/${hijriYear}`,
        dN: this.getDayShortHand(gregorianDate),
        uC: daysInMonth,
      });
    }
    
    return monthArray;
  }

  private generateDatesForGregorianMonth(gregorianYear: number, gregorianMonth: number): DayInfo[] {
    const daysInMonth = new Date(gregorianYear, gregorianMonth, 0).getDate();
    const monthArray: DayInfo[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const gregorianDate = new Date(gregorianYear, gregorianMonth - 1, day);
      const hijriDate = UmmAlQuraCalendarUtil.gregorianToHijri(gregorianDate);
      
      monthArray.push({
        gD: this.formatDate(gregorianDate),
        uD: `${hijriDate.day.toString().padStart(2, '0')}/${hijriDate.month.toString().padStart(2, '0')}/${hijriDate.year}`,
        dN: this.getDayShortHand(gregorianDate),
        uC: UmmAlQuraCalendarUtil.getDaysInMonth(hijriDate.year, hijriDate.month),
      });
    }
    
    return monthArray;
  }

  convertDate(dateStr: string, isGregorian: boolean): DayInfo | null {
    if (!dateStr) return null;

    try {
      if (isGregorian) {
        return this.convertGregorianDate(dateStr);
      } else {
        return this.convertHijriDate(dateStr);
      }
    } catch (error) {
      return null;
    }
  }

  private convertGregorianDate(dateStr: string): DayInfo | null {
    const gregorianDate = this.parseDate(dateStr);
    if (!gregorianDate) return null;

    try {
      const hijriDate = UmmAlQuraCalendarUtil.gregorianToHijri(gregorianDate);
      
      return {
        gD: this.formatDate(gregorianDate),
        uD: `${hijriDate.day.toString().padStart(2, '0')}/${hijriDate.month.toString().padStart(2, '0')}/${hijriDate.year}`,
        dN: this.getDayShortHand(gregorianDate),
        uC: UmmAlQuraCalendarUtil.getDaysInMonth(hijriDate.year, hijriDate.month),
      };
    } catch (error) {
      return null;
    }
  }

  private convertHijriDate(dateStr: string): DayInfo | null {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    try {
      const gregorianDate = UmmAlQuraCalendarUtil.hijriToGregorian(year, month, day);
      
      return {
        gD: this.formatDate(gregorianDate),
        uD: dateStr,
        dN: this.getDayShortHand(gregorianDate),
        uC: UmmAlQuraCalendarUtil.getDaysInMonth(year, month),
      };
    } catch (error) {
      return null;
    }
  }

  private setCachedMonthData(key: string, data: DayInfo[]): void {
    if (this.monthDataCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry (simple LRU-like behavior)
      const firstKey = this.monthDataCache.keys().next().value;
      this.monthDataCache.delete(firstKey);
    }
    this.monthDataCache.set(key, data);
  }

  getMonthData(inputDate: string, type: string): DayInfo[] | null {
    if (!inputDate || !type) return null;
    
    const dateParts = inputDate.split('/');
    if (dateParts.length !== 3) return null;
    
    const [day, month, year] = dateParts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    const isGregorian = type === 'greg';
    
    // Use cache for month data
    const cacheKey = `${year}-${month}-${type}`;
    const cachedData = this.monthDataCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const monthData = isGregorian 
        ? this.generateDatesForGregorianMonth(year, month)
        : this.generateDatesForHijriMonth(year, month);
      
      if (monthData && monthData.length > 0) {
        this.setCachedMonthData(cacheKey, monthData);
      }
      
      return monthData;
    } catch (error) {
      return null;
    }
  }

  checkPastOrFuture(inputDate: string, targetDate: Date): 'Past' | 'Today' | 'Future' | null {
    return DateFormattingUtil.compareDateToTarget(inputDate, targetDate);
  }
}
