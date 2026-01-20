import { CALENDAR_CONSTANTS } from '../_constants/calendar.constants';

export class NumberConversionUtil {
  private static readonly ARABIC_NUMBERS = [
    '\u0660', // ٠
    '\u0661', // ١
    '\u0662', // ٢
    '\u0663', // ٣
    '\u0664', // ٤
    '\u0665', // ٥
    '\u0666', // ٦
    '\u0667', // ٧
    '\u0668', // ٨
    '\u0669', // ٩
  ];

  private static readonly ENGLISH_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];


  // Converts English numbers to Arabic equivalent
  static toArabicNumerals(englishNum: number | string): string {
    if (!englishNum) return String(englishNum);

    const numStr = String(englishNum);
    return numStr.replace(/[0-9]/g, (digit) => {
      return this.ARABIC_NUMBERS[Number(digit)] || digit;
    });
  }

  // Converts Arabic numbers to English equivalent
  static toEnglishNumerals(arabicNum: string): string {
    return arabicNum.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (digit: string) => {
      return String(digit.charCodeAt(0) - CALENDAR_CONSTANTS.ARABIC_ZERO_UNICODE);
    });
  }


  // Converts Arabic numbers to English number for arithmetic operations
  static arabicToNumber(arabicNum: string): number {
    const converted = this.toEnglishNumerals(arabicNum);
    return Number(converted);
  }

  // Converts date numerals between Arabic and English
  static convertDateNumerals(date: string, targetLang: 'en' | 'ar'): string {
    if (targetLang === 'ar') {
      const [day, month, year] = date.split('/');
      return `${this.toArabicNumerals(year)}/${this.toArabicNumerals(month)}/${this.toArabicNumerals(day)}`;
    } else {
      const [year, month, day] = date.split('/');
      return `${this.toEnglishNumerals(day)}/${this.toEnglishNumerals(month)}/${this.toEnglishNumerals(year)}`;
    }
  }
}