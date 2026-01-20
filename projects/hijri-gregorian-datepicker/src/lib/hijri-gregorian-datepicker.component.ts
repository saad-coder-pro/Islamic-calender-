import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  HostBinding,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  TrackByFunction,
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StylesConfig } from '../_interfaces/styles-config.model';
import { TodayDate, DayInfo } from '../_interfaces/calendar.model';
import { DateUtilitiesService } from '../_services/date-utilities.service';
import * as themesConfig from '../themes/themes.json';
import { 
  umAlQura_MONTHS, 
  GREGORIAN_MONTHS, 
  WEEKDAYS_EN, 
  WEEKDAYS_AR, 
  CALENDAR_CONSTANTS, 
  CALENDAR_MODES,
  MonthData,
  CalendarMode 
} from '../_constants/calendar.constants';
import { NumberConversionUtil } from '../_utils/number-conversion.util';
import { DateFormattingUtil } from '../_utils/date-formatting.util';

@Component({
  selector: 'hijri-gregorian-datepicker',
  templateUrl: './hijri-gregorian-datepicker.component.html',
  styleUrls: ['./hijri-gregorian-datepicker.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HijriGregorianDatepickerComponent implements OnInit, OnChanges {
  /// Inputs
  @Input() markToday: boolean = true;
  @Input() canChangeMode: boolean = true;
  @Input() todaysDateSection: boolean = true;
  @Input() futureValidation: boolean = true;
  @Input() disableYearPicker: boolean = false;
  @Input() disableMonthPicker: boolean = false;
  @Input() disableDayPicker: boolean = false;
  @Input() multiple: boolean = false;
  @Input() isRequired: boolean = false;
  @Input() showConfirmButton: boolean = true;
  @Input() futureValidationMessage: boolean = false;
  @Input() arabicLayout: boolean = false;
  @Input() mode: CalendarMode = CALENDAR_MODES.GREGORIAN;
  @Input() dir: string = 'ltr';
  @Input() locale: string = 'en';
  @Input() submitTextButton: string = 'Confirm';
  @Input() todaysDateText: string = "Today's Date";
  @Input() umAlQuraDateText: string = 'Hijri Date';
  @Input() monthSelectLabel: string = 'Month';
  @Input() yearSelectLabel: string = 'Year';
  @Input() futureValidationMessageEn: string;
  @Input() futureValidationMessageAr: string;
  @Input() theme?: string = '';
  @Input() pastYearsLimit: number = 90;
  @Input() futureYearsLimit: number = 0;
  @Input() styles?: StylesConfig = {};
  /// Outputs
  @Output() onSubmit = new EventEmitter<DayInfo | DayInfo[]>();
  @Output() onDaySelect = new EventEmitter<DayInfo>();
  @Output() onMonthChange = new EventEmitter<number | null>();
  @Output() onYearChange = new EventEmitter<number | null>();
  /// Variables
  readonly umAlQuraMonths = umAlQura_MONTHS;
  readonly gregMonths = GREGORIAN_MONTHS;
  umAlQuraYear!: number;
  gregYear!: number;
  years: number[] = [];
  weeks: (DayInfo | null)[][] = [];
  months: MonthData[] = [];
  readonly weekdaysEn = WEEKDAYS_EN;
  readonly weekdaysAr = WEEKDAYS_AR;
  // weekdaysAr = ['س', 'ج', 'خ', 'أر', 'ث', 'إث', 'أح'];
  todaysDate: TodayDate = {};
  selectedDay: DayInfo | undefined;
  periodForm: FormGroup<{
    year: FormControl<number | null>;
    month: FormControl<number | null>;
  }>;
  multipleSelectedDates: DayInfo[] = [];
  themes: { default: Array<{ name: string; stylesConfig: StylesConfig }> } | null = null;

  // TrackBy functions for performance optimization
  trackByYear: TrackByFunction<number> = (index: number, year: number): number => year;
  trackByMonth: TrackByFunction<MonthData> = (index: number, month: MonthData): number => month.value;
  trackByWeekday: TrackByFunction<string> = (index: number, day: string): string => day;
  trackByWeek: TrackByFunction<(DayInfo | null)[]> = (index: number, week: (DayInfo | null)[]): string => `week-${index}`;
  trackByDay: TrackByFunction<DayInfo | null> = (index: number, day: DayInfo | null): string => day?.gD || `empty-${index}`;
  @HostBinding('style.font-family') fontFamilyStyle!: string;
  constructor(
    public formBuilder: FormBuilder,
    private _dateUtilsService: DateUtilitiesService
  ) { }

  ngOnInit(): void {
    this.initTheme();
    this.initializeForm();
    this.getTodaysDateInfo();
    this.initializeYearsAndMonths();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['mode'].isFirstChange()) {
      this.changeCalendarMode();
    }
  }

  initTheme(): void {
    if (this.theme !== '') {
      // Handle JSON import - check if it has a default property or use direct import
      if ('default' in themesConfig) {
        this.themes = themesConfig as { default: Array<{ name: string; stylesConfig: StylesConfig }> };
      } else {
        this.themes = { default: themesConfig as unknown as Array<{ name: string; stylesConfig: StylesConfig }> };
      }
      
      for (const themeItem of this.themes['default']) {
        if (themeItem.name === this.theme) {
          this.styles = themeItem.stylesConfig;
          break;
        }
      }
    }
    this.fontFamilyStyle = this.styles?.fontFamily || 'inherit';
  }

  /// Initialize form control for month and year select
  initializeForm(): void {
    this.periodForm = this.formBuilder.group({
      year: new FormControl<number | null>({ value: null, disabled: this.disableYearPicker }),
      month: new FormControl<number | null>({ value: null, disabled: this.disableMonthPicker }),
    });
  }

  // Initialize years and months for calendar
  initializeYearsAndMonths(): void {
    this.years = [];
    this.months = [];
    
    if (this.mode === CALENDAR_MODES.GREGORIAN) {
      this.initializeGregorianYearsAndMonths();
    } else {
      this.initializeumAlQuraYearsAndMonths();
    }
    
    this.setCurrentYearInForm();
    this.setCurrentMonthInForm();
  }

  private initializeGregorianYearsAndMonths(): void {
    const currentYear = this.getCurrentYear();
    this.gregYear = this.futureYearsLimit === 0 ? currentYear : currentYear + this.futureYearsLimit;
    this.years = this.generateYearsArray(this.gregYear);
    this.months = this.gregMonths;
  }

  private initializeumAlQuraYearsAndMonths(): void {
    const currentYear = this.getCurrentYear();
    this.umAlQuraYear = this.futureYearsLimit === 0 ? currentYear : currentYear + this.futureYearsLimit;
    this.years = this.generateYearsArray(this.umAlQuraYear);
    this.months = this.umAlQuraMonths;
  }

  private getCurrentYear(): number {
    const dateString = this.mode === CALENDAR_MODES.GREGORIAN 
      ? this.todaysDate.gregorian 
      : this.todaysDate.umAlQura;
    return Number(dateString?.split('/')[2]);
  }

  private generateYearsArray(maxYear: number): number[] {
    const years: number[] = [];
    let currentYear = maxYear;
    
    for (let i = 0; i < this.pastYearsLimit && i < maxYear; i++) {
      years.push(currentYear);
      currentYear--;
    }
    
    return years;
  }

  private setCurrentYearInForm(): void {
    const currentYear = this.getCurrentYear();
    const yearMatch = this.years.find(year => year === currentYear);
    if (yearMatch) {
      this.periodForm.controls.year.setValue(yearMatch);
    }
  }

  private setCurrentMonthInForm(): void {
    const dateString = this.mode === CALENDAR_MODES.GREGORIAN 
      ? this.todaysDate.gregorian 
      : this.todaysDate.umAlQura;
    const currentMonth = Number(dateString?.split('/')[1]);
    const monthMatch = this.months.find(month => month.value === currentMonth);
    if (monthMatch) {
      this.periodForm.controls.month.setValue(monthMatch.value);
    }
  }

  /// On change event of years and months
  onPeriodChange(type: 'year' | 'month'): void {
    this.emitPeriodChangeEvent(type);
    this.updateCalendarWeeks();
  }

  private emitPeriodChangeEvent(type: 'year' | 'month'): void {
    if (type === 'year') {
      this.onYearChange.emit(this.periodForm.controls.year.value);
    } else {
      this.onMonthChange.emit(this.periodForm.controls.month.value);
    }
  }

  private updateCalendarWeeks(): void {
    const formattedDate = this.buildDateString();
    const days = this._dateUtilsService.getMonthData(formattedDate, this.mode);
    this.weeks = this.generateWeeksArray(days);
  }

  private buildDateString(): string {
    const day = '01';
    const month = this.periodForm.controls.month.value;
    const year = this.periodForm.controls.year.value;
    return `${day}/${month}/${year}`;
  }

  /// Get todays(greg and umm al qura) date info
  getTodaysDateInfo(): void {
    try {
      this.todaysDate.gregorian = this._dateUtilsService.formatDate(new Date());
      this.todaysDate.umAlQura = this._dateUtilsService.convertDate(
        this.todaysDate.gregorian,
        true
      )?.uD;
      
      const dateToUse = this.mode === CALENDAR_MODES.GREGORIAN
        ? this.todaysDate.gregorian
        : this.todaysDate.umAlQura;
        
      if (dateToUse) {
        this.generateMonthData(dateToUse);
      }
    } catch (error) {
      console.error('Error initializing today\'s date:', error);
      // Fallback to current date
      this.todaysDate.gregorian = this._dateUtilsService.formatDate(new Date());
    }
  }

  /// Generate month days from JSON
  generateMonthData(date: string): void {
    if (!date) return;
    
    const days = this._dateUtilsService.getMonthData(date, this.mode);
    if (days && days.length > 0) {
      this.weeks = this.generateWeeksArray(days);
    }
  }

  /// Generate month weeks
  generateWeeksArray(daysArray: DayInfo[]): (DayInfo | null)[][] {
    if (!daysArray || daysArray.length === 0) {
      return [[]];
    }
    
    const firstDayName = daysArray[0]?.dN;
    const startIndex = WEEKDAYS_EN.indexOf(firstDayName);
    const weeks: (DayInfo | null)[][] = [[]];
    let currentWeek = 0;
    let currentDayIndex = startIndex;

    daysArray?.forEach((day: DayInfo) => {
      if (!weeks[currentWeek]) {
        weeks[currentWeek] = [];
      }

      weeks[currentWeek][currentDayIndex] = day;
      currentDayIndex++;

      if (currentDayIndex === CALENDAR_CONSTANTS.DAYS_IN_WEEK) {
        currentDayIndex = 0;
        currentWeek++;
      }
    });
    weeks.forEach((week: (DayInfo | null)[]) => {
      while (week.length < CALENDAR_CONSTANTS.DAYS_IN_WEEK) {
        week.push(null);
      }
    });
    return weeks;
  }

  /// Change calendar mode 'greg' or 'umAlQura'
  changeCalendarMode(): void {
    this.toggleCalendarMode();
    this.initializeYearsAndMonths();
    this.refreshCalendarData();
  }

  private toggleCalendarMode(): void {
    this.mode = this.mode === CALENDAR_MODES.GREGORIAN 
      ? CALENDAR_MODES.umAlQura 
      : CALENDAR_MODES.GREGORIAN;
  }

  private refreshCalendarData(): void {
    const formattedDate = this.buildDateString();
    this.generateMonthData(formattedDate);
  }

  /// On day clicked handler
  onDayClicked(day: DayInfo): void {
    if (day && day?.gD) {
      if (this.futureValidation) {
        if (this.checkFutureValidation(day)) {
          this.futureValidationMessage = true;
        } else {
          this.futureValidationMessage = false;
          this.markDaySelected(day);
        }
      } else {
        this.markDaySelected(day);
      }
    }
  }

  /// Mark day as selected
  markDaySelected(dayInfo: DayInfo): void {
    if (dayInfo.selected) {
      this.deselectDay(dayInfo);
    } else {
      this.selectDay(dayInfo);
    }
  }

  private deselectDay(dayInfo: DayInfo): void {
    dayInfo.selected = false;
    this.multipleSelectedDates = this.multipleSelectedDates.filter(
      (day) => day !== dayInfo
    );
    
    if (!this.multiple) {
      this.selectedDay = undefined;
    }
  }

  private selectDay(dayInfo: DayInfo): void {
    if (!this.multiple) {
      this.handleSingleSelection(dayInfo);
    } else {
      this.handleMultipleSelection(dayInfo);
    }
  }

  private handleSingleSelection(dayInfo: DayInfo): void {
    this.clearAllSelections();
    dayInfo.selected = true;
    this.selectedDay = dayInfo;
    this.multipleSelectedDates = [dayInfo];
    this.onDaySelect.emit(dayInfo);
  }

  private handleMultipleSelection(dayInfo: DayInfo): void {
    dayInfo.selected = true;
    this.onDaySelect.emit(dayInfo);
    
    if (!this.multipleSelectedDates.includes(dayInfo)) {
      this.multipleSelectedDates.push(dayInfo);
    }
  }

  private clearAllSelections(): void {
    this.weeks.forEach((week: (DayInfo | null)[]) => {
      week.forEach((day: DayInfo | null) => {
        if (day) {
          day.selected = false;
        }
      });
    });
  }

  /// On confirm button clicked
  onConfirmClicked(): void {
    if (this.multiple) {
      this.onSubmit.emit(this.multipleSelectedDates);
    } else {
      this.onSubmit.emit(this.selectedDay);
    }
  }

  /// Check if date from future
  checkFutureValidation(day: DayInfo): boolean | undefined {
    if (
      this._dateUtilsService.checkPastOrFuture(day?.gD, new Date()) === 'Future'
    ) {
      return true;
    }
  }

  /// Check if passed day is today or not
  checkTodaysDate(day: DayInfo): boolean {
    return (
      this.todaysDate?.gregorian === day?.gD ||
      this.todaysDate?.umAlQura === day?.uD
    );
  }

  /// Convert english numbers to arabic equivalent
  parseEnglish(englishNum: number | string): string {
    return NumberConversionUtil.toArabicNumerals(englishNum);
  }

  /// Convert arabic numbers to english equivalent
  parseArabic(arabicNum: string): string {
    return NumberConversionUtil.toEnglishNumerals(arabicNum);
  }

  /// Convert arabic numbers to english number for arithmetic operations
  parseArabicToNumber(arabicNum: string): number {
    return NumberConversionUtil.arabicToNumber(arabicNum);
  }
}
