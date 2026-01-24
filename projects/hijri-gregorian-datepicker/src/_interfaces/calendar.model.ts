export interface DayInfo {
  gD: string; // Gregorian date
  uD: string; // Um al-Qurra date
  dN: string; // Day name shorthand
  uC: number; // Days in month
  selected?: boolean;
  isRangeStart?: boolean; // First day of range selection
  isRangeEnd?: boolean; // Last day of range selection
  isInRange?: boolean; // Day between start and end of range
}

export interface TodayDate {
  gregorian?: string;
  umAlQura?: string;
}
