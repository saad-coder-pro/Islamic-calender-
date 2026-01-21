export interface MonthData {
  labelAr: string;
  labelEn: string;
  value: number;
}

export const umAlQura_MONTHS: MonthData[] = [
  { labelAr: 'محرم', labelEn: 'Muharram', value: 1 },
  { labelAr: 'صفر', labelEn: 'Safar', value: 2 },
  { labelAr: 'ربيع الأول', labelEn: 'Rabi al-Awwal', value: 3 },
  { labelAr: 'ربيع الثاني', labelEn: 'Rabi al-Thani', value: 4 },
  { labelAr: 'جمادى الأولى', labelEn: 'Jumada al-Awwal', value: 5 },
  { labelAr: 'جمادى الآخرة', labelEn: 'Jumada al-Thani', value: 6 },
  { labelAr: 'رجب', labelEn: 'Rajab', value: 7 },
  { labelAr: 'شعبان', labelEn: 'Shaban', value: 8 },
  { labelAr: 'رمضان', labelEn: 'Ramadan', value: 9 },
  { labelAr: 'شوال', labelEn: 'Shawwal', value: 10 },
  { labelAr: 'ذو القعدة', labelEn: 'Dhu al-Qadah', value: 11 },
  { labelAr: 'ذو الحجة', labelEn: 'Dhu al-Hijjah', value: 12 },
];

export const GREGORIAN_MONTHS: MonthData[] = [
  { labelAr: 'يناير', labelEn: 'January', value: 1 },
  { labelAr: 'فبراير', labelEn: 'February', value: 2 },
  { labelAr: 'مارس', labelEn: 'March', value: 3 },
  { labelAr: 'ابريل', labelEn: 'April', value: 4 },
  { labelAr: 'مايو', labelEn: 'May', value: 5 },
  { labelAr: 'يونيو', labelEn: 'June', value: 6 },
  { labelAr: 'يوليو', labelEn: 'July', value: 7 },
  { labelAr: 'اغسطس', labelEn: 'August', value: 8 },
  { labelAr: 'سبتمبر', labelEn: 'September', value: 9 },
  { labelAr: 'اكتوبر', labelEn: 'October', value: 10 },
  { labelAr: 'نوفمبر', labelEn: 'November', value: 11 },
  { labelAr: 'ديسمبر', labelEn: 'December', value: 12 },
];

export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_AR = ['سبت', 'جمعة', 'خميس', 'أربعاء', 'ثلاثاء', 'اثنين', 'أحد'];

export const CALENDAR_CONSTANTS = {
  DAYS_IN_WEEK: 7,
  MAX_MONTH_VALUE: 12,
  MIN_MONTH_VALUE: 1,
  DATE_PART_COUNT: 3,
  ARABIC_ZERO_UNICODE: 1632,
} as const;

export const CALENDAR_MODES = {
  GREGORIAN: 'greg',
  umAlQura: 'umAlQura'
} as const;

export type CalendarMode = typeof CALENDAR_MODES[keyof typeof CALENDAR_MODES];