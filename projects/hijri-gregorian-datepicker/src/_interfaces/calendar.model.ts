export interface DayInfo {
  gD: string; // Gregorian date
  uD: string; // Um al-Qurra date
  dN: string; // Day name shorthand
  uC: number; // Days in month
  selected?: boolean;
}

export interface TodayDate {
  gregorian?: string;
  umAlQura?: string;
}
