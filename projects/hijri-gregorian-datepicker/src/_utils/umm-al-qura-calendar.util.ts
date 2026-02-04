/**
 * UmAlQura Calendar - TypeScript Implementation
 * Ported from Microsoft .NET System.Globalization.UmAlQuraCalendar
 * 
 * Calendar support range:
 *   Gregorian: 1900/04/30 - 2077/11/17
 *   UmAlQura:  1318/01/01 - 1500/12/30
 */

const MIN_CALENDAR_YEAR = 1318;
const MAX_CALENDAR_YEAR = 1500;
const MS_PER_DAY = 86400000;

interface HijriYearInfo {
  hijriMonthsLengthFlags: number;
  gregorianDate: Date;
}

interface HijriDate {
  year: number;
  month: number;
  day: number;
}

// Raw data from .NET source - each entry: [HijriMonthsLengthFlags, GYear, GMonth, GDay]
const RAW_DATA = [
  0x02EA, 1900, 4, 30,
  0x06E9, 1901, 4, 19,
  0x0ED2, 1902, 4, 9,
  0x0EA4, 1903, 3, 30,
  0x0D4A, 1904, 3, 18,
  0x0A96, 1905, 3, 7,
  0x0536, 1906, 2, 24,
  0x0AB5, 1907, 2, 13,
  0x0DAA, 1908, 2, 3,
  0x0BA4, 1909, 1, 23,
  0x0B49, 1910, 1, 12,
  0x0A93, 1911, 1, 1,
  0x052B, 1911, 12, 21,
  0x0A57, 1912, 12, 9,
  0x04B6, 1913, 11, 29,
  0x0AB5, 1914, 11, 18,
  0x05AA, 1915, 11, 8,
  0x0D55, 1916, 10, 27,
  0x0D2A, 1917, 10, 17,
  0x0A56, 1918, 10, 6,
  0x04AE, 1919, 9, 25,
  0x095D, 1920, 9, 13,
  0x02EC, 1921, 9, 3,
  0x06D5, 1922, 8, 23,
  0x06AA, 1923, 8, 13,
  0x0555, 1924, 8, 1,
  0x04AB, 1925, 7, 21,
  0x095B, 1926, 7, 10,
  0x02BA, 1927, 6, 30,
  0x0575, 1928, 6, 18,
  0x0BB2, 1929, 6, 8,
  0x0764, 1930, 5, 29,
  0x0749, 1931, 5, 18,
  0x0655, 1932, 5, 6,
  0x02AB, 1933, 4, 25,
  0x055B, 1934, 4, 14,
  0x0ADA, 1935, 4, 4,
  0x06D4, 1936, 3, 24,
  0x0EC9, 1937, 3, 13,
  0x0D92, 1938, 3, 3,
  0x0D25, 1939, 2, 20,
  0x0A4D, 1940, 2, 9,
  0x02AD, 1941, 1, 28,
  0x056D, 1942, 1, 17,
  0x0B6A, 1943, 1, 7,
  0x0B52, 1943, 12, 28,
  0x0AA5, 1944, 12, 16,
  0x0A4B, 1945, 12, 5,
  0x0497, 1946, 11, 24,
  0x0937, 1947, 11, 13,
  0x02B6, 1948, 11, 2,
  0x0575, 1949, 10, 22,
  0x0D6A, 1950, 10, 12,
  0x0D52, 1951, 10, 2,
  0x0A96, 1952, 9, 20,
  0x092D, 1953, 9, 9,
  0x025D, 1954, 8, 29,
  0x04DD, 1955, 8, 18,
  0x0ADA, 1956, 8, 7,
  0x05D4, 1957, 7, 28,
  0x0DA9, 1958, 7, 17,
  0x0D52, 1959, 7, 7,
  0x0AAA, 1960, 6, 25,
  0x04D6, 1961, 6, 14,
  0x09B6, 1962, 6, 3,
  0x0374, 1963, 5, 24,
  0x0769, 1964, 5, 12,
  0x0752, 1965, 5, 2,
  0x06A5, 1966, 4, 21,
  0x054B, 1967, 4, 10,
  0x0AAB, 1968, 3, 29,
  0x055A, 1969, 3, 19,
  0x0AD5, 1970, 3, 8,
  0x0DD2, 1971, 2, 26,
  0x0DA4, 1972, 2, 16,
  0x0D49, 1973, 2, 4,
  0x0A95, 1974, 1, 24,
  0x052D, 1975, 1, 13,
  0x0A5D, 1976, 1, 2,
  0x055A, 1976, 12, 22,
  0x0AD5, 1977, 12, 11,
  0x06AA, 1978, 12, 1,
  0x0695, 1979, 11, 20,
  0x052B, 1980, 11, 8,
  0x0A57, 1981, 10, 28,
  0x04AE, 1982, 10, 18,
  0x0976, 1983, 10, 7,
  0x056C, 1984, 9, 26,
  0x0B55, 1985, 9, 15,
  0x0AAA, 1986, 9, 5,
  0x0A55, 1987, 8, 25,
  0x04AD, 1988, 8, 13,
  0x095D, 1989, 8, 2,
  0x02DA, 1990, 7, 23,
  0x05D9, 1991, 7, 12,
  0x0DB2, 1992, 7, 1,
  0x0BA4, 1993, 6, 21,
  0x0B4A, 1994, 6, 10,
  0x0A55, 1995, 5, 30,
  0x02B5, 1996, 5, 18,
  0x0575, 1997, 5, 7,
  0x0B6A, 1998, 4, 27,
  0x0BD2, 1999, 4, 17,
  0x0BC4, 2000, 4, 6,
  0x0B89, 2001, 3, 26,
  0x0A95, 2002, 3, 15,
  0x052D, 2003, 3, 4,
  0x05AD, 2004, 2, 21,
  0x0B6A, 2005, 2, 10,
  0x06D4, 2006, 1, 31,
  0x0DC9, 2007, 1, 20,
  0x0D92, 2008, 1, 10,
  0x0AA6, 2008, 12, 29,
  0x0956, 2009, 12, 18,
  0x02AE, 2010, 12, 7,
  0x056D, 2011, 11, 26,
  0x036A, 2012, 11, 15,
  0x0B55, 2013, 11, 4,
  0x0AAA, 2014, 10, 25,
  0x094D, 2015, 10, 14,
  0x049D, 2016, 10, 2,
  0x095D, 2017, 9, 21,
  0x02BA, 2018, 9, 11,
  0x05B5, 2019, 8, 31,
  0x05AA, 2020, 8, 20,
  0x0D55, 2021, 8, 9,
  0x0A9A, 2022, 7, 30,
  0x092E, 2023, 7, 19,
  0x026E, 2024, 7, 7,
  0x055D, 2025, 6, 26,
  0x0ADA, 2026, 6, 16,
  0x06D4, 2027, 6, 6,
  0x06A5, 2028, 5, 25,
  0x054B, 2029, 5, 14,
  0x0A97, 2030, 5, 3,
  0x054E, 2031, 4, 23,
  0x0AAE, 2032, 4, 11,
  0x05AC, 2033, 4, 1,
  0x0BA9, 2034, 3, 21,
  0x0D92, 2035, 3, 11,
  0x0B25, 2036, 2, 28,
  0x064B, 2037, 2, 16,
  0x0CAB, 2038, 2, 5,
  0x055A, 2039, 1, 26,
  0x0B55, 2040, 1, 15,
  0x06D2, 2041, 1, 4,
  0x0EA5, 2041, 12, 24,
  0x0E4A, 2042, 12, 14,
  0x0A95, 2043, 12, 3,
  0x052D, 2044, 11, 21,
  0x0AAD, 2045, 11, 10,
  0x036C, 2046, 10, 31,
  0x0759, 2047, 10, 20,
  0x06D2, 2048, 10, 9,
  0x0695, 2049, 9, 28,
  0x052D, 2050, 9, 17,
  0x0A5B, 2051, 9, 6,
  0x04BA, 2052, 8, 26,
  0x09BA, 2053, 8, 15,
  0x03B4, 2054, 8, 5,
  0x0B69, 2055, 7, 25,
  0x0B52, 2056, 7, 14,
  0x0AA6, 2057, 7, 3,
  0x04B6, 2058, 6, 22,
  0x096D, 2059, 6, 11,
  0x02EC, 2060, 5, 31,
  0x06D9, 2061, 5, 20,
  0x0EB2, 2062, 5, 10,
  0x0D54, 2063, 4, 30,
  0x0D2A, 2064, 4, 18,
  0x0A56, 2065, 4, 7,
  0x04AE, 2066, 3, 27,
  0x096D, 2067, 3, 16,
  0x0D6A, 2068, 3, 5,
  0x0B54, 2069, 2, 23,
  0x0B29, 2070, 2, 12,
  0x0A93, 2071, 2, 1,
  0x052B, 2072, 1, 21,
  0x0A57, 2073, 1, 9,
  0x0536, 2073, 12, 30,
  0x0AB5, 2074, 12, 19,
  0x06AA, 2075, 12, 9,
  0x0E93, 2076, 11, 27,
  0, 2077, 11, 17
];

// Initialize the HijriYearInfo array from raw data
const HIJRI_YEAR_INFO: HijriYearInfo[] = [];
for (let i = 0; i < RAW_DATA.length / 4; i++) {
  HIJRI_YEAR_INFO.push({
    hijriMonthsLengthFlags: RAW_DATA[i * 4],
    gregorianDate: new Date(Date.UTC(RAW_DATA[i * 4 + 1], RAW_DATA[i * 4 + 2] - 1, RAW_DATA[i * 4 + 3]))
  });
}

// Min/Max supported dates
const MIN_DATE = new Date(Date.UTC(1900, 3, 30));
const MAX_DATE = new Date(Date.UTC(2077, 10, 16, 23, 59, 59, 999));

export class UmmAlQuraCalendarUtil {
  
  private static checkDateRange(date: Date): void {
    const time = date.getTime();
    if (time < MIN_DATE.getTime() || time > MAX_DATE.getTime()) {
      throw new RangeError(
        `Date is out of range. Supported range: ${MIN_DATE.toISOString()} to ${MAX_DATE.toISOString()}`
      );
    }
  }

  private static checkYearRange(year: number): void {
    if (year < MIN_CALENDAR_YEAR || year > MAX_CALENDAR_YEAR) {
      throw new RangeError(
        `Year ${year} is out of range. Supported range: ${MIN_CALENDAR_YEAR} to ${MAX_CALENDAR_YEAR}`
      );
    }
  }

  private static checkYearMonthRange(year: number, month: number): void {
    UmmAlQuraCalendarUtil.checkYearRange(year);
    if (month < 1 || month > 12) {
      throw new RangeError(`Month ${month} is out of range. Must be between 1 and 12.`);
    }
  }

  static getDaysInMonth(year: number, month: number): number {
    UmmAlQuraCalendarUtil.checkYearMonthRange(year, month);
    const flags = HIJRI_YEAR_INFO[year - MIN_CALENDAR_YEAR].hijriMonthsLengthFlags;
    return (flags & (1 << (month - 1))) === 0 ? 29 : 30;
  }



  static gregorianToHijri(date: Date): HijriDate {
    UmmAlQuraCalendarUtil.checkDateRange(date);
    
    // Create a normalized date to avoid timezone issues
    // Use the date as-is without UTC conversion to preserve local date values
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const time = normalizedDate.getTime();
    
    const minTime = MIN_DATE.getTime();
    
    let index = Math.floor((time - minTime) / MS_PER_DAY / 355);
    
    while (index < HIJRI_YEAR_INFO.length - 1 && 
           time >= HIJRI_YEAR_INFO[index + 1].gregorianDate.getTime()) {
      index++;
    }
    
    const yearStartTime = HIJRI_YEAR_INFO[index].gregorianDate.getTime();
    let nDays = Math.floor((time - yearStartTime) / MS_PER_DAY);
    
    const hijriYear = index + MIN_CALENDAR_YEAR;
    let hijriMonth = 1;
    let hijriDay = 1;
    
    let flags = HIJRI_YEAR_INFO[index].hijriMonthsLengthFlags;
    let daysPerThisMonth = 29 + (flags & 1);
    
    while (nDays >= daysPerThisMonth) {
      nDays -= daysPerThisMonth;
      flags = flags >> 1;
      daysPerThisMonth = 29 + (flags & 1);
      hijriMonth++;
    }
    
    hijriDay += nDays;
    
    return {
      year: hijriYear,
      month: hijriMonth,
      day: hijriDay
    };
  }

  static hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    UmmAlQuraCalendarUtil.checkYearMonthRange(hijriYear, hijriMonth);
    
    const daysInMonth = UmmAlQuraCalendarUtil.getDaysInMonth(hijriYear, hijriMonth);
    if (hijriDay < 1 || hijriDay > daysInMonth) {
      throw new RangeError(
        `Day ${hijriDay} is out of range for month ${hijriMonth}. Must be between 1 and ${daysInMonth}.`
      );
    }
    
    const index = hijriYear - MIN_CALENDAR_YEAR;
    const yearStart = HIJRI_YEAR_INFO[index].gregorianDate;
    let flags = HIJRI_YEAR_INFO[index].hijriMonthsLengthFlags;
    
    let nDays = hijriDay - 1;
    
    for (let m = 1; m < hijriMonth; m++) {
      nDays += 29 + (flags & 0x1);
      flags = flags >> 1;
    }
    
    return new Date(yearStart.getTime() + nDays * MS_PER_DAY);
  }

}