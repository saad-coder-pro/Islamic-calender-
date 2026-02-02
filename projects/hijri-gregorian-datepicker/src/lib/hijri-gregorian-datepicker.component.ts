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
  ChangeDetectorRef,
  TrackByFunction,
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StylesConfig } from '../_interfaces/styles-config.model';
import { FadeInAnimationDirective } from './_directives/fade-in-animation.directive';
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
import { UmmAlQuraCalendarUtil } from '../_utils/umm-al-qura-calendar.util';

@Component({
  selector: 'hijri-gregorian-datepicker',
  templateUrl: './hijri-gregorian-datepicker.component.html',
  styleUrls: ['./hijri-gregorian-datepicker.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, FadeInAnimationDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HijriGregorianDatepickerComponent implements OnInit, OnChanges {
  /// Inputs
  @Input() canChangeMode: boolean = true;
  @Input() futureValidation: boolean = true;
  @Input() pastDateValidation: boolean = false;
  @Input() disableYearPicker: boolean = false;
  @Input() disableMonthPicker: boolean = false;
  @Input() disableDayPicker: boolean = false;
  @Input() showNavigationArrows: boolean = true;
  @Input() enableAnimations: boolean = true;
  @Input() multiple: boolean = false;
  @Input() isRequired: boolean = false;
  @Input() showConfirmButton: boolean = true;
  @Input() mode: CalendarMode = CALENDAR_MODES.GREGORIAN;
  @Input() dir: string = 'ltr';
  @Input() locale: string = 'en';
  @Input() submitTextButton: string = 'Confirm';
  @Input() futureValidationMessageEn: string;
  @Input() futureValidationMessageAr: string;
  @Input() pastDateValidationMessageEn: string;
  @Input() pastDateValidationMessageAr: string;
  @Input() theme?: string = '';
  @Input() pastYearsLimit: number = 90;
  @Input() futureYearsLimit: number = 0;
  @Input() minDate?: string; // Format: 'dd/mm/yyyy'
  @Input() maxDate?: string; // Format: 'dd/mm/yyyy'
  @Input() disabledDates?: string[]; // Array of dates in format: 'dd/mm/yyyy'
  @Input() rangeSelection: boolean = false; // Enable date range selection
  @Input() initialDate?: string; // Initial date to open calendar to (format: 'dd/mm/yyyy')
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
  selectedRange: { start: DayInfo | null; end: DayInfo | null } = { start: null, end: null };
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
  
  // View states
  currentView: 'years' | 'months' | 'days' = 'days';
  showMonthDropdown: boolean = false;
  showYearDropdown: boolean = false;

  // Validation states
  private futureValidationActive: boolean = false;
  private pastDateValidationActive: boolean = false;

  // TrackBy functions for performance optimization
  trackByYear: TrackByFunction<number> = (index: number, year: number): number => year;
  trackByMonth: TrackByFunction<MonthData> = (index: number, month: MonthData): number => month.value;
  trackByWeekday: TrackByFunction<string> = (index: number, day: string): string => day;
  trackByWeek: TrackByFunction<(DayInfo | null)[]> = (index: number, week: (DayInfo | null)[]): string => `week-${index}`;
  trackByDay: TrackByFunction<DayInfo | null> = (index: number, day: DayInfo | null): string => day?.gD || `empty-${index}`;
  @HostBinding('style.font-family') fontFamilyStyle!: string;
    
  constructor(
    public formBuilder: FormBuilder,
    private _dateUtilsService: DateUtilitiesService,
    private cdr: ChangeDetectorRef
  ) { }

  /// Check if future validation message should be displayed
  showFutureValidationMessage(): boolean {
    return this.futureValidationActive;
  }

  /// Check if past date validation message should be displayed  
  showPastDateValidationMessage(): boolean {
    return this.pastDateValidationActive;
  }

  ngOnInit(): void {
    this.initTheme();
    this.initializeForm();
    this.getTodaysDateInfo();
    this.initializeYearsAndMonths();
    this.updateCalendarWeeks();
    this.initializeView();
    
    // Initialize validation message states
    this.futureValidationActive = false;
    this.pastDateValidationActive = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mode'] && !changes['mode'].isFirstChange()) {
      this.changeCalendarMode();
    }
    
    if (changes['initialDate'] && !changes['initialDate'].isFirstChange()) {
      this.initializeYearsAndMonths();
      this.updateCalendarWeeks();
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

  // Helper method to get font family safely
  getFontFamily(): string | undefined {
    return this.styles?.fontFamily && this.styles.fontFamily.trim() !== '' ? this.styles.fontFamily : undefined;
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
    this.gregYear = currentYear;
    this.years = this.generateYearsArray(currentYear);
    this.months = this.gregMonths;
  }

  private initializeumAlQuraYearsAndMonths(): void {
    const currentYear = this.getCurrentYear();
    this.umAlQuraYear = currentYear;
    this.years = this.generateYearsArray(currentYear);
    this.months = this.umAlQuraMonths;
  }

  private getCurrentYear(): number {
    const dateString = this.getEffectiveDate();
    return Number(dateString?.split('/')[2]);
  }

  private getEffectiveDate(): string | undefined {
    // Use initialDate if provided and valid, otherwise use today's date
    if (this.initialDate && this.isValidInitialDate(this.initialDate)) {
      if (this.mode === CALENDAR_MODES.GREGORIAN) {
        return this.initialDate;
      } else {
        // Convert initialDate to Hijri for Hijri mode
        const convertedDate = this._dateUtilsService.convertDate(this.initialDate, true);
        return convertedDate?.uD;
      }
    }
    
    // Fallback to today's date
    return this.mode === CALENDAR_MODES.GREGORIAN 
      ? this.todaysDate.gregorian 
      : this.todaysDate.umAlQura;
  }

  private isValidInitialDate(dateStr: string): boolean {
    // Check if the date string is in valid format
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateStr)) {
      return false;
    }

    // Parse the date to ensure it's a valid date
    const parsedDate = this._dateUtilsService.parseDate(dateStr);
    if (!parsedDate) {
      return false;
    }

    // Check against minDate and maxDate constraints
    if (this.minDate) {
      const minDateParsed = this._dateUtilsService.parseDate(this.minDate);
      if (minDateParsed && parsedDate < minDateParsed) {
        return false;
      }
    }

    if (this.maxDate) {
      const maxDateParsed = this._dateUtilsService.parseDate(this.maxDate);
      if (maxDateParsed && parsedDate > maxDateParsed) {
        return false;
      }
    }

    return true;
  }

  private generateYearsArray(currentYear: number): number[] {
    const years: number[] = [];
    
    // Define calendar system limits
    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const minYear = isGregorian ? 1901 : 1318;
    const maxYear = isGregorian ? 2077 : 1500;
    
    // Calculate effective past and future limits based on calendar bounds
    const maxPastYears = Math.min(this.pastYearsLimit, currentYear - minYear);
    const maxFutureYears = Math.min(this.futureYearsLimit, maxYear - currentYear);
    
    // Add past years (including current year)
    for (let i = 0; i <= maxPastYears; i++) {
      const year = currentYear - i;
      if (year >= minYear) {
        years.push(year);
      }
    }
    
    // Add future years (excluding current year to avoid duplication)
    for (let i = 1; i <= maxFutureYears; i++) {
      const year = currentYear + i;
      if (year <= maxYear) {
        years.push(year);
      }
    }
    
    // Sort years in descending order (latest first)
    return years.sort((a, b) => b - a);
  }

  private setCurrentYearInForm(): void {
    const currentYear = this.getCurrentYear();
    const yearMatch = this.years.find(year => year === currentYear);
    if (yearMatch) {
      this.periodForm.controls.year.setValue(yearMatch);
    }
  }

  private setCurrentMonthInForm(): void {
    const dateString = this.getEffectiveDate();
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
    
    // Reset validation messages when period changes
    this.futureValidationActive = false;
    this.pastDateValidationActive = false;
    
    // Close dropdowns
    this.closeDropdowns();
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
    this.markInitialDateAsSelected();
  }

  private markInitialDateAsSelected(): void {
    if (!this.initialDate || this.selectedDay) return; // Don't auto-select if user already selected something
    
    // Find the initial date in the current weeks and mark it as selected
    for (const week of this.weeks) {
      for (const day of week) {
        if (day && this.checkInitialDate(day)) {
          day.selected = true;
          this.selectedDay = day;
          this.onDaySelect.emit(day);
          this.cdr.detectChanges();
          return;
        }
      }
    }
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
      // Create today's date normalized to local timezone to avoid boundary issues
      const today = new Date();
      const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      this.todaysDate.gregorian = this._dateUtilsService.formatDate(normalizedToday);
      
      // Special handling for today's date to ensure accuracy
      const hijriConversion = this._dateUtilsService.convertDate(
        this.todaysDate.gregorian,
        true
      );
      
      if (hijriConversion?.uD) {
        // Apply +1 day correction for today's date only (known calendar offset issue)
        const hijriParts = hijriConversion.uD.split('/');
        let day = parseInt(hijriParts[0]);
        let month = parseInt(hijriParts[1]); 
        let year = parseInt(hijriParts[2]);
        
        // Add one day for today's date accuracy
        day += 1;
        
        // Handle month overflow
        const daysInMonth = this.getHijriDaysInMonth(year, month);
        if (day > daysInMonth) {
          day = 1;
          month += 1;
          if (month > 12) {
            month = 1;
            year += 1;
          }
        }
        
        this.todaysDate.umAlQura = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      } else {
        this.todaysDate.umAlQura = hijriConversion?.uD || '';
      }
      
      const dateToUse = this.mode === CALENDAR_MODES.GREGORIAN
        ? this.todaysDate.gregorian
        : this.todaysDate.umAlQura;
        
      if (dateToUse) {
        this.generateMonthData(dateToUse);
      }
    } catch (error) {
      // Fallback to current date
      this.todaysDate.gregorian = this._dateUtilsService.formatDate(new Date());
      console.error('Error getting today\'s date info:', error);
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
    
    // Refresh today's date info after mode change to ensure correct highlighting
    this.getTodaysDateInfo();
    
    this.initializeYearsAndMonths();
    this.refreshCalendarData();
    
    // Reset validation messages when calendar mode changes
    this.futureValidationActive = false;
    this.pastDateValidationActive = false;
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

  /// Navigate to previous or next month
  navigateMonth(direction: 'previous' | 'next'): void {
    const currentMonth = this.periodForm.controls.month.value;
    const currentYear = this.periodForm.controls.year.value;
    
    if (!currentMonth || !currentYear) return;

    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === 'next') {
      if (currentMonth === 12) {
        newMonth = 1;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    } else {
      if (currentMonth === 1) {
        newMonth = 12;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    }

    // Check if the new year is within calendar system limits
    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const minYear = isGregorian ? 1901 : 1318;
    const maxYear = isGregorian ? 2077 : 1500;
    
    // Don't navigate beyond calendar system limits
    if (newYear < minYear || newYear > maxYear) {
      return;
    }

    // Check if the new year is within allowed range
    const yearExists = this.years.includes(newYear);
    if (!yearExists) {
      // Update years array if needed
      this.updateYearsRange(newYear);
    }

    // Update form controls
    this.periodForm.controls.year.setValue(newYear);
    this.periodForm.controls.month.setValue(newMonth);

    // Update calendar display
    this.updateCalendarWeeks();
    
    // Reset validation messages
    this.futureValidationActive = false;
    this.pastDateValidationActive = false;

    // Close any open dropdowns
    this.closeDropdowns();

    // Emit events
    this.onYearChange.emit(newYear);
    this.onMonthChange.emit(newMonth);
  }

  /// Update years range if navigation goes beyond current range
  private updateYearsRange(targetYear: number): void {
    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const minYear = isGregorian ? 1901 : 1318;
    const maxYear = isGregorian ? 2077 : 1500;
    
    // Only add year if it's within calendar system limits
    if (targetYear >= minYear && targetYear <= maxYear) {
      if (!this.years.includes(targetYear)) {
        this.years.push(targetYear);
        this.years.sort((a, b) => b - a); // Keep descending order
      }
    }
  }

  /// Check if previous month navigation should be disabled
  canNavigatePrevious(): boolean {
    const currentMonth = this.periodForm.controls.month.value;
    const currentYear = this.periodForm.controls.year.value;
    
    if (!currentMonth || !currentYear) return false;

    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const minYear = isGregorian ? 1901 : 1318;
    
    // Check if we're at the minimum year and first month
    if (currentYear === minYear && currentMonth === 1) {
      return false;
    }
    
    return true;
  }

  /// Check if next month navigation should be disabled
  canNavigateNext(): boolean {
    const currentMonth = this.periodForm.controls.month.value;
    const currentYear = this.periodForm.controls.year.value;
    
    if (!currentMonth || !currentYear) return false;

    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const maxYear = isGregorian ? 2077 : 1500;
    
    // Check if we're at the maximum year and last month
    if (currentYear === maxYear && currentMonth === 12) {
      return false;
    }
    
    return true;
  }

  /// Navigate to month selection view
  toggleMonthDropdown(): void {
    this.currentView = 'months';
  }

  /// Navigate to year selection view
  toggleYearDropdown(): void {
    this.currentView = 'years';
  }

  /// Select a month from grid
  selectMonth(monthValue: number): void {
    this.periodForm.controls.month.setValue(monthValue);
    this.currentView = 'days';
    this.onPeriodChange('month');
  }

  /// Select a year from grid
  selectYear(yearValue: number): void {
    this.periodForm.controls.year.setValue(yearValue);
    this.currentView = 'months';
    this.onPeriodChange('year');
  }

  /// Get current month label for display
  getCurrentMonthLabel(): string {
    const currentMonth = this.periodForm.controls.month.value;
    if (!currentMonth) return this.locale === 'ar' ? 'الشهر' : 'Month';
    
    const monthData = this.months.find(month => month.value === currentMonth);
    if (!monthData) return this.locale === 'ar' ? 'الشهر' : 'Month';
    
    return this.locale === 'ar' ? monthData.labelAr : monthData.labelEn;
  }

  /// Get current year label for display
  getCurrentYearLabel(): string {
    const currentYear = this.periodForm.controls.year.value;
    if (!currentYear) return this.locale === 'ar' ? 'السنة' : 'Year';
    
    return this.locale === 'ar' ? this.parseEnglish(currentYear) : currentYear.toString();
  }

  /// Close dropdowns when clicking outside (called from host listener)
  closeDropdowns(): void {
    // No longer needed for grid-based navigation
  }

  /// Handle clicks within the calendar layout
  onCalendarClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Check if click is within the period selector or its dropdowns
    const periodSelector = target.closest('.unified-period-selector');
    const monthDropdown = target.closest('.month-dropdown');
    const yearDropdown = target.closest('.year-dropdown');
    const periodText = target.closest('.period-text');
    
    // If click is not in the period selector area or dropdowns, close dropdowns
    if (!periodSelector && !monthDropdown && !yearDropdown && !periodText) {
      this.closeDropdowns();
    }
  }

  /// On day clicked handler
  onDayClicked(day: DayInfo): void {
    console.log('onDayClicked called with:', day);
    console.log('rangeSelection mode:', this.rangeSelection);
    
    // Close any open dropdowns when clicking on a day
    this.closeDropdowns();
    
    if (day && day?.gD) {
      // Check if date is disabled by any validation rule
      if (this.isDateDisabled(day)) {
        console.log('Date is disabled');
        this.futureValidationActive = this.futureValidation && this.checkFutureValidation(day);
        this.pastDateValidationActive = this.pastDateValidation && this.checkPastDateValidation(day);
        return;
      }
      
      this.futureValidationActive = false;
      this.pastDateValidationActive = false;
      
      // Handle different selection modes
      if (this.rangeSelection) {
        console.log('Calling handleRangeSelection');
        this.handleRangeSelection(day);
      } else {
        console.log('Calling markDaySelected');
        this.markDaySelected(day);
      }
    } else {
      console.log('Invalid day or missing gD:', day);
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

  /// Get all dates in the selected range (start, between, end)
  private getAllDatesInRange(): DayInfo[] {
    if (!this.selectedRange.start || !this.selectedRange.end) {
      return [];
    }

    const allDatesInRange: DayInfo[] = [];
    
    // Add start date
    allDatesInRange.push(this.selectedRange.start);
    
    // Add all dates between start and end
    this.weeks.forEach((week: (DayInfo | null)[]) => {
      week.forEach((day: DayInfo | null) => {
        if (day && day.isInRange) {
          allDatesInRange.push(day);
        }
      });
    });
    
    // Add end date (if different from start)
    if (this.selectedRange.start !== this.selectedRange.end) {
      allDatesInRange.push(this.selectedRange.end);
    }
    
    // Sort dates chronologically
    allDatesInRange.sort((a, b) => {
      const dateA = new Date(this.parseDate(a.gD || ''));
      const dateB = new Date(this.parseDate(b.gD || ''));
      return dateA.getTime() - dateB.getTime();
    });
    
    return allDatesInRange;
  }

  /// On confirm button clicked
  onConfirmClicked(): void {
    console.log('onConfirmClicked called');
    console.log('rangeSelection:', this.rangeSelection);
    console.log('multiple:', this.multiple);
    console.log('selectedRange:', this.selectedRange);
    
    if (this.rangeSelection && this.selectedRange.start && this.selectedRange.end) {
      const allDatesInRange = this.getAllDatesInRange();
      console.log('All dates in range (start, between, end):', allDatesInRange);
      console.log('Total dates in range:', allDatesInRange.length);
      
      // Log each date for clarity
      allDatesInRange.forEach((date, index) => {
        const dateType = date.isRangeStart ? 'START' : 
                        date.isRangeEnd ? 'END' : 
                        date.isInRange ? 'BETWEEN' : 'UNKNOWN';
        console.log(`${index + 1}. ${dateType}: ${date.gD} (${date.uD})`);
      });
      
      this.onSubmit.emit(allDatesInRange);
    } else if (this.multiple) {
      console.log('Emitting multiple selection');
      this.onSubmit.emit(this.multipleSelectedDates);
    } else {
      console.log('Emitting single selection');
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

  /// Check if date is from past
  checkPastDateValidation(day: DayInfo): boolean | undefined {
    if (
      this._dateUtilsService.checkPastOrFuture(day?.gD, new Date()) === 'Past'
    ) {
      return true;
    }
  }

  /// Check if passed day is today or not
  checkTodaysDate(day: DayInfo): boolean {
    if (this.mode === CALENDAR_MODES.GREGORIAN) {
      return this.todaysDate?.gregorian === day?.gD;
    } else {
      return this.todaysDate?.umAlQura === day?.uD;
    }
  }

  /// Check if passed day should be highlighted (today or initial date)
  checkHighlightedDate(day: DayInfo): boolean {
    const isTodaysDate = this.checkTodaysDate(day);
    const isInitialDate = this.checkInitialDate(day);
    return isTodaysDate || isInitialDate;
  }

  /// Check if passed day is the initial date
  checkInitialDate(day: DayInfo): boolean {
    if (!this.initialDate) return false;
    
    if (this.mode === CALENDAR_MODES.GREGORIAN) {
      return this.initialDate === day?.gD;
    } else {
      // Convert initialDate to Hijri and compare
      const convertedDate = this._dateUtilsService.convertDate(this.initialDate, true);
      return convertedDate?.uD === day?.uD;
    }
  }

  /// Check if date is before minDate
  checkMinDateValidation(day: DayInfo): boolean {
    if (!this.minDate) return false;
    
    // Always use Gregorian date for comparison since minDate is Gregorian
    const dayDate = day?.gD;
    if (!dayDate) return false;
    
    // Convert minDate string to Date object
    const minDateParts = this.minDate.split('/');
    const minDateObj = new Date(Number(minDateParts[2]), Number(minDateParts[1]) - 1, Number(minDateParts[0]));
    
    return this._dateUtilsService.checkPastOrFuture(dayDate, minDateObj) === 'Past';
  }

  /// Check if date is after maxDate
  checkMaxDateValidation(day: DayInfo): boolean {
    if (!this.maxDate) return false;
    
    // Always use Gregorian date for comparison since maxDate is Gregorian
    const dayDate = day?.gD;
    if (!dayDate) return false;
    
    // Convert maxDate string to Date object
    const maxDateParts = this.maxDate.split('/');
    const maxDateObj = new Date(Number(maxDateParts[2]), Number(maxDateParts[1]) - 1, Number(maxDateParts[0]));
    
    return this._dateUtilsService.checkPastOrFuture(dayDate, maxDateObj) === 'Future';
  }

  /// Check if date is in disabled dates array
  checkDisabledDate(day: DayInfo): boolean {
    if (!this.disabledDates || this.disabledDates.length === 0) return false;
    
    // Always use Gregorian date for comparison since disabledDates are Gregorian
    const dayDate = day?.gD;
    return this.disabledDates.includes(dayDate || '');
  }

  /// Check if date should be disabled (combines all validation rules)
  isDateDisabled(day: DayInfo): boolean {
    return this.checkMinDateValidation(day) || 
           this.checkMaxDateValidation(day) || 
           this.checkDisabledDate(day) ||
           (this.futureValidation && this.checkFutureValidation(day) === true) ||
           (this.pastDateValidation && this.checkPastDateValidation(day) === true);
  }

  /// Handle range selection
  private handleRangeSelection(dayInfo: DayInfo): void {
    console.log('handleRangeSelection called with:', dayInfo);
    console.log('Current selectedRange:', this.selectedRange);
    
    if (this.isDateDisabled(dayInfo)) {
      console.log('Date is disabled, returning');
      return;
    }
    
    if (!this.selectedRange.start || this.selectedRange.end) {
      // Start new range
      console.log('Starting new range');
      this.clearRangeSelection();
      this.selectedRange.start = dayInfo;
      dayInfo.selected = true;
      dayInfo.isRangeStart = true;
      console.log('Set range start:', dayInfo);
    } else {
      // Complete the range
      console.log('Completing range');
      this.selectedRange.end = dayInfo;
      dayInfo.selected = true;
      dayInfo.isRangeEnd = true;
      this.highlightRange();
      
      // Log the completed range but don't emit yet (only on confirm)
      const allDatesInRange = this.getAllDatesInRange();
      console.log('Range completed with all dates:', allDatesInRange);
      console.log('Range ready for confirmation. Click Confirm button to submit.');
    }
    
    // Force change detection
    this.cdr.detectChanges();
    this.onDaySelect.emit(dayInfo);
  }

  /// Clear range selection
  private clearRangeSelection(): void {
    this.weeks.forEach((week: (DayInfo | null)[]) => {
      week.forEach((day: DayInfo | null) => {
        if (day) {
          day.selected = false;
          day.isRangeStart = false;
          day.isRangeEnd = false;
          day.isInRange = false;
        }
      });
    });
    this.selectedRange = { start: null, end: null };
  }

  /// Highlight dates between start and end
  private highlightRange(): void {
    if (!this.selectedRange.start || !this.selectedRange.end) return;
    
    const startDate = new Date(this.parseDate(this.selectedRange.start.gD || ''));
    const endDate = new Date(this.parseDate(this.selectedRange.end.gD || ''));
    
    // Ensure dates are in correct order
    const earlierDate = startDate <= endDate ? startDate : endDate;
    const laterDate = startDate <= endDate ? endDate : startDate;
    
    // Update range flags for proper visual feedback
    if (startDate > endDate) {
      // Swap the range flags if dates are reversed
      this.selectedRange.start.isRangeEnd = true;
      this.selectedRange.start.isRangeStart = false;
      this.selectedRange.end.isRangeStart = true;
      this.selectedRange.end.isRangeEnd = false;
    }
    
    this.weeks.forEach((week: (DayInfo | null)[]) => {
      week.forEach((day: DayInfo | null) => {
        if (day && day.gD) {
          const dayDate = new Date(this.parseDate(day.gD));
          
          // Check if day is between start and end (exclusive)
          if (dayDate > earlierDate && dayDate < laterDate) {
            day.isInRange = true;
          }
          
          // Handle edge case where start and end are the same day
          if (earlierDate.getTime() === laterDate.getTime() && dayDate.getTime() === earlierDate.getTime()) {
            day.isRangeStart = true;
            day.isRangeEnd = true;
            day.isInRange = false;
          }
        }
      });
    });
  }

  /// Helper to parse date string to Date object
  private parseDate(dateStr: string): string {
    const parts = dateStr.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
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

  /// Get current display text for the header
  getCurrentDisplayText(): string {
    if (this.currentView === 'years') {
      return this.getYearRangeDisplay();
    } else if (this.currentView === 'months') {
      const currentYear = this.periodForm.controls.year.value;
      if (currentYear) {
        return this.locale === 'ar' ? this.parseEnglish(currentYear) : currentYear.toString();
      }
      return this.locale === 'ar' ? 'السنة' : 'Year';
    } else {
      const currentMonth = this.periodForm.controls.month.value;
      const currentYear = this.periodForm.controls.year.value;
      
      if (currentMonth && currentYear) {
        const monthData = this.months.find(month => month.value === currentMonth);
        const monthName = monthData ? (this.locale === 'ar' ? monthData.labelAr : monthData.labelEn) : '';
        const yearStr = this.locale === 'ar' ? this.parseEnglish(currentYear) : currentYear.toString();
        return `${monthName} ${yearStr}`;
      }
      return '';
    }
  }

  /// Get days in Hijri month for date calculations
  private getHijriDaysInMonth(year: number, month: number): number {
    // Hijri months alternate between 29 and 30 days, with adjustments
    // This is a simplified version - in practice the service should be used
    try {
      return UmmAlQuraCalendarUtil.getDaysInMonth(year, month);
    } catch {
      // Fallback: Hijri months are typically 29 or 30 days
      return month % 2 === 1 ? 30 : 29;
    }
  }

  /// Get current year in the active calendar system
  private getCurrentCalendarYear(): number {
    if (this.mode === CALENDAR_MODES.GREGORIAN) {
      return new Date().getFullYear();
    } else {
      // Get current Hijri year
      const todaysGregorian = this._dateUtilsService.formatDate(new Date());
      const todaysHijri = this._dateUtilsService.convertDate(todaysGregorian, true);
      return todaysHijri ? Number(todaysHijri.uD?.split('/')[2]) : new Date().getFullYear();
    }
  }

  /// Get year range display for years view
  getYearRangeDisplay(): string {
    const displayYears = this.getDisplayYears();
    if (displayYears.length > 0) {
      const firstYear = displayYears[0];
      const lastYear = displayYears[displayYears.length - 1];
      if (this.locale === 'ar') {
        return `${this.parseEnglish(firstYear)} - ${this.parseEnglish(lastYear)}`;
      } else {
        return `${firstYear} - ${lastYear}`;
      }
    }
    return '';
  }

  /// Get years to display in the grid
  getDisplayYears(): number[] {
    const currentYear = this.periodForm.controls.year.value || this.getCurrentCalendarYear();
    const startYear = Math.floor(currentYear / 12) * 12;
    const years = [];
    
    // Get current calendar year and calculate limits based on calendar system
    const currentCalendarYear = this.getCurrentCalendarYear();
    const minYear = currentCalendarYear - this.pastYearsLimit;
    const maxYear = currentCalendarYear + this.futureYearsLimit;
    
    // Apply calendar system constraints
    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const systemMinYear = isGregorian ? 1901 : 1318;
    const systemMaxYear = isGregorian ? 2077 : 1500;
    
    // Use the more restrictive bounds
    const effectiveMinYear = Math.max(minYear, systemMinYear);
    const effectiveMaxYear = Math.min(maxYear, systemMaxYear);
    
    for (let i = 0; i < 12; i++) {
      const year = startYear + i;
      if (year >= effectiveMinYear && year <= effectiveMaxYear) {
        years.push(year);
      }
    }
    
    return years;
  }

  /// Check if a year is the current year
  isCurrentYear(year: number): boolean {
    const today = new Date();
    return year === today.getFullYear();
  }

  /// Check if a month is the current month
  isCurrentMonth(month: number): boolean {
    const today = new Date();
    const currentYear = this.periodForm.controls.year.value;
    return month === today.getMonth() + 1 && currentYear === today.getFullYear();
  }

  /// Initialize the view based on component state
  private initializeView(): void {
    // Always start with days view to match the original design
    this.currentView = 'days';
  }

  /// Handle title click to navigate between views
  onTitleClick(): void {
    if (this.currentView === 'days') {
      this.currentView = 'months';
    } else if (this.currentView === 'months') {
      this.currentView = 'years';
    }
  }

  /// Navigate years in year view
  navigateYears(direction: 'previous' | 'next'): void {
    const currentYear = this.periodForm.controls.year.value || this.getCurrentCalendarYear();
    const currentStartYear = Math.floor(currentYear / 12) * 12;
    const newStartYear = direction === 'next' ? currentStartYear + 12 : currentStartYear - 12;
    
    // Get current calendar year and calculate limits based on calendar system
    const currentCalendarYear = this.getCurrentCalendarYear();
    const minYear = currentCalendarYear - this.pastYearsLimit;
    const maxYear = currentCalendarYear + this.futureYearsLimit;
    
    // Apply calendar system constraints
    const isGregorian = this.mode === CALENDAR_MODES.GREGORIAN;
    const systemMinYear = isGregorian ? 1901 : 1318;
    const systemMaxYear = isGregorian ? 2077 : 1500;
    
    // Use the more restrictive bounds
    const effectiveMinYear = Math.max(minYear, systemMinYear);
    const effectiveMaxYear = Math.min(maxYear, systemMaxYear);
    
    // Check if the new range would be within allowed limits
    const newRangeMinYear = newStartYear;
    const newRangeMaxYear = newStartYear + 11;
    
    // Only navigate if the new range has at least some years within the allowed limits
    if ((newRangeMinYear <= effectiveMaxYear && newRangeMaxYear >= effectiveMinYear)) {
      this.periodForm.controls.year.setValue(newStartYear);
      this.updateYearsRange(newStartYear);
    }
  }
}
