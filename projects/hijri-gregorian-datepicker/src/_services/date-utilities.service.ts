import { Injectable } from '@angular/core';
import * as datesDictionary from '../_data/dictionary.json';
import { Data, DayInfo, MonthDays, MonthInfo } from '../_interfaces/calendar.model';
import { DateFormattingUtil } from '../_utils/date-formatting.util';
import { NumberConversionUtil } from '../_utils/number-conversion.util';

@Injectable({
  providedIn: 'root',
})
export class DateUtilitiesService {
  public calendarData: Data;
  private monthDataCache = new Map<string, DayInfo[]>();
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    // Handle JSON import - check if it has a default property or use direct import
    if ('default' in datesDictionary) {
      this.calendarData = (datesDictionary as { default: Data }).default;
    } else {
      this.calendarData = datesDictionary as unknown as Data;
    }
    
  }

  parseDate(dateStr: string): Date | null {
    return DateFormattingUtil.parseDate(dateStr);
  }

  formatDate(date: Date): string {
    return DateFormattingUtil.formatDate(date);
  }

  getDayShortHand(date: Date): string {
    return DateFormattingUtil.getDayShortHand(date);
  }

  generateDates(fD: DayInfo, lD: DayInfo, uC: number): MonthDays {
    const startDate = this.parseDate(fD?.gD);
    const endDate = this.parseDate(lD?.gD);
    const daysInMonth: MonthDays = [];
    let currentGregorianDate = new Date(startDate);
    let currentUmmAlQuraDay = parseInt(fD?.uD?.split('/')[0]);
    let currentUmmAlQuraMonth = parseInt(fD?.uD?.split('/')[1]);
    let currentUmmAlQuraYear = parseInt(fD?.uD?.split('/')[2]);
    let daysInCurrentUmmAlQuraMonth = uC;
    while (currentGregorianDate <= endDate) {
      const ummAlQuraDate = `${currentUmmAlQuraDay
        .toString()
        .padStart(2, '0')}/${currentUmmAlQuraMonth
        .toString()
        .padStart(2, '0')}/${currentUmmAlQuraYear}`;
      daysInMonth.push({
        gD: this.formatDate(currentGregorianDate),
        uD: ummAlQuraDate,
        dN: this.getDayShortHand(currentGregorianDate),
        uC: 0,
      });
      currentGregorianDate.setDate(currentGregorianDate.getDate() + 1);
      currentUmmAlQuraDay += 1;
      if (currentUmmAlQuraDay > daysInCurrentUmmAlQuraMonth) {
        currentUmmAlQuraDay = 1;
        currentUmmAlQuraMonth += 1;
        if (currentUmmAlQuraMonth > 12) {
          currentUmmAlQuraMonth = 1;
          currentUmmAlQuraYear += 1;
        }
        const nextMonthData =
          this.calendarData[currentUmmAlQuraYear.toString()]?.[
            currentUmmAlQuraMonth.toString()
          ];
        daysInCurrentUmmAlQuraMonth = nextMonthData ? nextMonthData.fD.uC : 30;
      }
    }
    return daysInMonth;
  }

  convertDate(dateStr: string, isGregorian: boolean): DayInfo | null {
    if (!dateStr) return null;

    if (isGregorian) {
      return this.convertGregorianDate(dateStr);
    } else {
      return this.convertUmmAlQuraDate(dateStr);
    }
  }

  private convertGregorianDate(dateStr: string): DayInfo | null {
    const gregorianDate = this.parseDate(dateStr);
    if (!gregorianDate) return null;
    const formattedDate = this.formatDate(gregorianDate);

    // Extract year and month for more efficient lookup
    const targetYear = gregorianDate.getFullYear();
    const targetMonth = gregorianDate.getMonth() + 1;

    // Look for data in target year and adjacent years
    const yearsToCheck = [targetYear - 1, targetYear, targetYear + 1];
    
    for (const year of yearsToCheck) {
      const yearData = this.calendarData[year];
      if (!yearData) continue;

      for (const monthKey in yearData) {
        const monthData = yearData[monthKey];
        const cacheKey = `${year}-${monthKey}-greg`;
        
        let daysInMonth = this.monthDataCache.get(cacheKey);
        if (!daysInMonth) {
          if (this.isDateInMonthRange(formattedDate, monthData.fD?.gD, monthData.lD?.gD)) {
            daysInMonth = this.generateDates(monthData.fD, monthData.lD, monthData.fD?.uC);
            this.setCachedMonthData(cacheKey, daysInMonth);
          } else {
            continue;
          }
        }

        const dayMatch = daysInMonth.find((d) => d.gD === formattedDate);
        if (dayMatch) return dayMatch;
      }
    }

    return null;
  }

  private convertUmmAlQuraDate(dateStr: string): DayInfo | null {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    // Original working logic - search through all years
    for (const yearKey in this.calendarData) {
      for (const monthKey in this.calendarData[yearKey]) {
        const monthData = this.calendarData[yearKey][monthKey];

        if (
          this.isDateInMonthRange(
            `${day}/${month}/${year}`,
            monthData.fD?.uD,
            monthData.lD?.uD
          )
        ) {
          const daysInMonth = this.generateDates(
            monthData.fD,
            monthData.lD,
            monthData.fD?.uC
          );

          const dayMatch = daysInMonth.find((d) => {
            const [uDay, uMonth, uYear] = d?.uD?.split('/').map(Number);
            return uDay === day && uMonth === month && uYear === year;
          });

          if (dayMatch) return dayMatch;
        }
      }
    }

    return null;
  }

  private setCachedMonthData(key: string, data: DayInfo[]): void {
    if (this.monthDataCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry (simple LRU-like behavior)
      const firstKey = this.monthDataCache.keys().next().value;
      this.monthDataCache.delete(firstKey);
    }
    this.monthDataCache.set(key, data);
  }

  private isDateInMonthRange(
    dateToCheck: string,
    monthStartDate: string | undefined,
    monthEndDate: string | undefined
  ): boolean {
    if (!monthStartDate || !monthEndDate) return false;

    const checkDate = this.parseDate(dateToCheck);
    const startDate = this.parseDate(monthStartDate);
    const endDate = this.parseDate(monthEndDate);

    if (!checkDate || !startDate || !endDate) return false;

    return checkDate >= startDate && checkDate <= endDate;
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
        ? this.getGregorianMonthData(day, month, year)
        : this.getUmAlQurraMonthData(day, month, year);
      
      if (monthData && monthData.length > 0) {
        this.setCachedMonthData(cacheKey, monthData);
      }
      
      return monthData;
    } catch (error) {
      console.error('Error getting month data:', error, { inputDate, type });
      return null;
    }
  }

  getGregorianMonthData(
    day: number,
    month: number,
    year: number
  ): DayInfo[] | null {
    const yearData = this.calendarData[year];
    if (!yearData) return null;
    const monthData = yearData[month];
    if (!monthData) return null;
    const monthArray: DayInfo[] = [];
    const endDate = new Date(year, month, 0);
    for (let d = 1; d <= endDate.getDate(); d++) {
      const offset = d - 1;

      monthArray.push({
        gD: `${d.toString().padStart(2, '0')}/${month
          .toString()
          .padStart(2, '0')}/${year}`,
        uD: this.calculateUmAlQurraDate(
          monthData.fD.uD,
          offset,
          monthData.fD.uC
        ),
        dN: this.getDayName(new Date(year, month - 1, d).getDay()),
        uC: monthData.fD.uC,
      });
    }

    return monthArray;
  }

  getUmAlQurraMonthData(
    day: number,
    month: number,
    year: number
  ): DayInfo[] | null {
    // Original working logic - search through all years in the calendar data
    for (const gregorianYear in this.calendarData) {
      const yearData = this.calendarData[parseInt(gregorianYear)];

      for (const monthIndex in yearData) {
        const monthData = yearData[parseInt(monthIndex)];
        const ummAlQuraDateParts = monthData?.fD?.uD?.split('/').map(Number);
        if (!ummAlQuraDateParts) continue;
        
        const [fDay, fMonth, fYear] = ummAlQuraDateParts;

        if (fYear === year && fMonth === month) {
          return this.generateUmmAlQuraMonthArray(monthData, month, year);
        }
      }
    }

    return null;
  }

  private generateUmmAlQuraMonthArray(monthData: MonthInfo, month: number, year: number): DayInfo[] {
    const totalDays = monthData.fD.uC;
    const monthArray: DayInfo[] = [];
    const umAlQurraStartDate = DateFormattingUtil.buildDateString('01', month, year);
    const dayDifference = parseInt(monthData.fD.uD.split('/')[0]) - 1;

    const startGregorianDate = this.calculateGregorianDate(
      monthData.fD.gD,
      -dayDifference
    );

    for (let i = 0; i < totalDays; i++) {
      const uDate = this.calculateUmAlQurraDate(
        umAlQurraStartDate,
        i,
        totalDays
      );
      const gDate = this.calculateGregorianDate(startGregorianDate, i);
      const gregorianParts = gDate?.split('/').map(Number);
      
      if (gregorianParts) {
        const [gDay, gMonth, gYear] = gregorianParts;
        const dayName = this.getDayName(
          new Date(gYear, gMonth - 1, gDay).getDay()
        );

        monthArray.push({
          gD: gDate,
          uD: uDate,
          dN: dayName,
          uC: totalDays,
        });
      }
    }

    return monthArray;
  }

  calculateGregorianDate(startGDate: string, offset: number): string {
    const [day, month, year] = startGDate?.split('/').map(Number);
    const newDate = new Date(year, month - 1, day + offset);

    return `${newDate.getDate().toString().padStart(2, '0')}/${(
      newDate.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${newDate.getFullYear()}`;
  }

  calculateUmAlQurraDate(
    startUDate: string,
    offset: number,
    uC: number
  ): string {
    const [day, month, year] = startUDate?.split('/').map(Number);

    let newDay = day + offset;
    let newMonth = month;
    let newYear = year;

    while (newDay > uC) {
      newDay -= uC;
      newMonth += 1;
    }

    while (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    return `${newDay.toString().padStart(2, '0')}/${newMonth
      .toString()
      .padStart(2, '0')}/${newYear}`;
  }

  getDayName(dayIndex: number): string {
    return DateFormattingUtil.getDayName(dayIndex);
  }

  /// Check date is it in past or future
  checkPastOrFuture(inputDate: string, targetDate: Date): 'Past' | 'Today' | 'Future' | null {
    return DateFormattingUtil.compareDateToTarget(inputDate, targetDate);
  }

  /// Convert english numbers to arabic equivalent
  parseEnglish(englishNum: number | string): string {
    return NumberConversionUtil.toArabicNumerals(englishNum);
  }

  /// Convert arabic numbers to english equivalent
  parseArabic(arabicNum: string): string {
    return NumberConversionUtil.toEnglishNumerals(arabicNum);
  }

  /// Convert date numerals between Arabic and English
  convertDateNumerals(date: string, targetLang: 'en' | 'ar'): string {
    return NumberConversionUtil.convertDateNumerals(date, targetLang);
  }
}
