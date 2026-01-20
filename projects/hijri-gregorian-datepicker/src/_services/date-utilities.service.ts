import { Injectable } from '@angular/core';
import * as datesDictionary from '../_data/dictionary.json';
import { Data, DayInfo, MonthDays } from '../_interfaces/calendar-model';

@Injectable({
  providedIn: 'root',
})
export class DateUtilitiesService {
  public calendarData: Data;

  constructor() {
    this.calendarData = (datesDictionary as any)['default']; //prod
    // this.calendarData = datesDictionary; //debug
  }

  parseDate(dateStr: string): Date | null {
    if (!dateStr) {
      return null;
    }
    const parts = dateStr?.split('/');
    if (parts.length !== 3) {
      return null;
    }
    const [day, month, year] = parts.map(Number);
    if (
      isNaN(day) ||
      isNaN(month) ||
      isNaN(year) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1
    ) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getDayShortHand(date: Date): string {
    return date.toLocaleString('en-US', { weekday: 'short' });
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
      // Preprocess Gregorian date
      const gregorianDate = this.parseDate(dateStr);
      if (!gregorianDate) return null;
      const formattedDate = this.formatDate(gregorianDate);

      for (const yearKey in this.calendarData) {
        for (const monthKey in this.calendarData[yearKey]) {
          const monthData = this.calendarData[yearKey][monthKey];

          if (
            this.isDateInMonthRange(
              formattedDate,
              monthData.fD?.gD,
              monthData.lD?.gD
            )
          ) {
            const daysInMonth = this.generateDates(
              monthData.fD,
              monthData.lD,
              monthData.fD?.uC
            );

            const dayMatch = daysInMonth.find((d) => d.gD === formattedDate);
            if (dayMatch) return dayMatch;
          }
        }
      }
    } else {
      const [day, month, year] = dateStr.split('/').map(Number);

      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

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
    }

    return null;
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
    const [day, month, year] = inputDate?.split('/').map(Number);
    let isGregorian: boolean;
    if (type == 'greg') {
      isGregorian = true;
    } else {
      isGregorian = false;
    }
    if (isGregorian) {
      return this.getGregorianMonthData(day, month, year);
    } else {
      return this.getUmAlQurraMonthData(day, month, year);
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
    for (const gregorianYear in this.calendarData) {
      const yearData = this.calendarData[parseInt(gregorianYear)];

      for (const monthIndex in yearData) {
        const monthData = yearData[parseInt(monthIndex)];
        const [fDay, fMonth, fYear] = monthData?.fD?.uD?.split('/').map(Number);

        if (fYear === year && fMonth === month) {
          const totalDays = monthData.fD.uC;
          const monthArray: DayInfo[] = [];
          const umAlQurraStartDate = `01/${month
            .toString()
            .padStart(2, '0')}/${year}`;
          const dayDifference = fDay - 1;

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
            const [gDay, gMonth, gYear] = gDate?.split('/').map(Number);
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

          return monthArray;
        }
      }
    }

    return null;
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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  }

  /// Check date is it in past or future
  checkPastOrFuture(inputDate: string, targetDate: Date): 'Past' | 'Today' | 'Future' | undefined {
    if (inputDate) {
      const [day, month, year] = inputDate?.split('/').map(Number);
      const dateToCheck = new Date(year, month - 1, day);
      const today = targetDate;
      today.setHours(0, 0, 0, 0);
      if (dateToCheck > today) {
        return 'Future';
      } else if (dateToCheck < today) {
        return 'Past';
      } else {
        return 'Today';
      }
    }
  }

  /// Convert english numbers to arabic equivalent
  parseEnglish(englishNum: any) {
    if (!englishNum) return englishNum;
    const numStr = String(englishNum);
    const arabicNumbers = [
      '\u0660',
      '\u0661',
      '\u0662',
      '\u0663',
      '\u0664',
      '\u0665',
      '\u0666',
      '\u0667',
      '\u0668',
      '\u0669',
    ];
    return numStr.replace(/[0-9]/g, (digit) => {
      return arabicNumbers[Number(digit)] || digit;
    });
  }

  /// Convert arabic numbers to english equivalent
  parseArabic(arabicNum: any) {
    return arabicNum.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function (d: string) {
      return d.charCodeAt(0) - 1632;
    });
  }

  ///
  convertDateNumerals(date: string, targetLang: 'en' | 'ar'): string {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const toArabic = (value: string) =>
      value
        .split('')
        .map((char) => (/\d/.test(char) ? arabicNumbers[+char] : char))
        .join('');

    const toEnglish = (value: string) =>
      value
        .split('')
        .map((char) => {
          const index = arabicNumbers.indexOf(char);
          return index > -1 ? englishNumbers[index] : char;
        })
        .join('');

    if (targetLang === 'ar') {
      const [day, month, year] = date.split('/');
      return `${toArabic(year)}/${toArabic(month)}/${toArabic(day)}`;
    } else {
      const [year, month, day] = date.split('/');
      return `${toEnglish(day)}/${toEnglish(month)}/${toEnglish(year)}`;
    }
  }
}
