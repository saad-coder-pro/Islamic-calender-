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
import { stylesConfig } from '../interfaces/styles-config-model';
import { TodayDate, DayInfo } from '../interfaces/calendar-model';
import { DateUtilitiesService } from '../public-api';

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
  @Input() mode: string = 'greg';
  @Input() dir: string = 'ltr';
  @Input() locale: string = 'en';
  @Input() submitTextButton: string = 'Confirm';
  @Input() todaysDateText: string = "Today's Date";
  @Input() ummAlQuraDateText: string = 'Hijri Date';
  @Input() monthSelectLabel: string = 'Month';
  @Input() yearSelectLabel: string = 'Year';
  @Input() futureValidationMessageEn: string;
  @Input() futureValidationMessageAr: string;
  @Input() theme?: string = '';
  @Input() pastYearsLimit: number = 90;
  @Input() futureYearsLimit: number = 0;
  @Input() styles?: stylesConfig = {};
  /// Outputs
  @Output() onSubmit = new EventEmitter<DayInfo | DayInfo[]>();
  @Output() onDaySelect = new EventEmitter<DayInfo>();
  @Output() onMonthChange = new EventEmitter<number | null>();
  @Output() onYearChange = new EventEmitter<number | null>();
  /// Variables
  ummAlQuraMonths = [
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
  gregMonths = [
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
  ummAlQuraYear!: number;
  gregYear!: number;
  years: number[] = [];
  weeks: DayInfo[][] = [];
  months: { labelAr: string; labelEn: string; value: number }[] = [];
  weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekdaysAr = ['سبت', 'جمعة', 'خميس', 'أربعاء', 'ثلاثاء', 'اثنين', 'أحد'];
  // weekdaysAr = ['س', 'ج', 'خ', 'أر', 'ث', 'إث', 'أح'];
  todaysDate: TodayDate = {};
  selectedDay: DayInfo | undefined;
  periodForm: FormGroup<{
    year: FormControl<number | null>;
    month: FormControl<number | null>;
  }>;
  multipleSelectedDates: DayInfo[] = [];

  // TrackBy functions for performance optimization
  trackByYear: TrackByFunction<number> = (index: number, year: number): number => year;
  trackByMonth: TrackByFunction<{ labelAr: string; labelEn: string; value: number }> = (index: number, month: { labelAr: string; labelEn: string; value: number }): number => month.value;
  trackByWeekday: TrackByFunction<string> = (index: number, day: string): string => day;
  trackByWeek: TrackByFunction<DayInfo[]> = (index: number, week: DayInfo[]): string => `week-${index}`;
  trackByDay: TrackByFunction<DayInfo> = (index: number, day: DayInfo): string => day?.gD || `empty-${index}`;
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

  initTheme() {
    if (this.theme != '') {
      this.themes = themesConfig;
      for (const themeItem of this.themes['default']) {
        if (themeItem.name == this.theme) {
          this.styles = themeItem.stylesConfig;
          break;
        }
      }
    }
    this.fontFamilyStyle = this.styles.fontFamily;
  }

  /// Initialize form control for month and year select
  initializeForm() {
    this.periodForm = this.formBuilder.group({
      year: new FormControl<number | null>({ value: null, disabled: this.disableYearPicker }),
      month: new FormControl<number | null>({ value: null, disabled: this.disableMonthPicker }),
    });
  }

  // Initialize years and months for calendar
  initializeYearsAndMonths() {
    this.years = [];
    this.months = [];
    if (this.mode == 'greg') {
      this.gregYear =
        this.futureYearsLimit == 0
          ? Number(this.todaysDate.gregorian?.split('/')[2])
          : Number(this.todaysDate.gregorian?.split('/')[2]) +
            this.futureYearsLimit;
      for (let i = 0; i < this.gregYear; i++) {
        if (i < this.pastYearsLimit) {
          let val = this.gregYear--;
          this.years.push(val);
        } else {
          break;
        }
      }
      this.months = this.gregMonths;
    } else {
      this.ummAlQuraYear =
        this.futureYearsLimit == 0
          ? Number(this.todaysDate.ummAlQura?.split('/')[2])
          : Number(this.todaysDate.ummAlQura?.split('/')[2]) +
            this.futureYearsLimit;
      for (let i = 0; i < this.ummAlQuraYear; i++) {
        if (i < this.pastYearsLimit) {
          let val = this.ummAlQuraYear--;
          this.years.push(val);
        } else {
          break;
        }
      }
      this.months = this.ummAlQuraMonths;
    }
    this.years.map((year: any) => {
      if (
        year ==
        (this.mode == 'greg'
          ? this.todaysDate.gregorian?.split('/')[2]
          : this.todaysDate.ummAlQura?.split('/')[2])
      ) {
        this.periodForm.controls.year.setValue(year);
      }
    });
    this.months.map((month: any) => {
      if (
        month.value ==
        (this.mode == 'greg'
          ? this.todaysDate.gregorian?.split('/')[1]
          : this.todaysDate.ummAlQura?.split('/')[1])
      ) {
        this.periodForm.controls.month.setValue(month.value);
      }
    });
  }

  /// On change event of years and months
  onPeriodChange(type: string) {
    if (type == 'year') {
      this.onYearChange.emit(this.periodForm.controls.year.value);
    } else {
      this.onMonthChange.emit(this.periodForm.controls.month.value);
    }
    const days = this._dateUtilsService.getMonthData(
      '01/' +
      this.periodForm.controls.month.value +
      '/' +
      this.periodForm.controls.year.value,
      this.mode
    );
    this.weeks = this.generateWeeksArray(days);
  }

  /// Get todays(greg and umm al qura) date info
  getTodaysDateInfo() {
    this.todaysDate.gregorian = this._dateUtilsService.formatDate(new Date());
    this.todaysDate.ummAlQura = this._dateUtilsService.convertDate(
      this.todaysDate.gregorian,
      true
    )?.uD;
    this.generatetMonthData(
      this.mode == 'greg'
        ? this.todaysDate.gregorian
        : this.todaysDate.ummAlQura
    );
  }

  /// Generate month days from JSON
  generatetMonthData(date: string) {
    const days = this._dateUtilsService.getMonthData(date, this.mode);
    this.weeks = this.generateWeeksArray(days);
  }

  /// Generate month weeks
  generateWeeksArray(daysArray: DayInfo[]): DayInfo[][] {
    const firstDayName = daysArray[0]?.dN;
    const startIndex = this.weekdaysEn.indexOf(firstDayName);
    const weeks = [[]] as any;
    let currentWeek = 0;
    let currentDayIndex = startIndex;

    daysArray?.forEach((day: any) => {
      if (!weeks[currentWeek]) {
        weeks[currentWeek] = [];
      }

      weeks[currentWeek][currentDayIndex] = day;
      currentDayIndex++;

      if (currentDayIndex === 7) {
        currentDayIndex = 0;
        currentWeek++;
      }
    });
    weeks.forEach((week: any) => {
      while (week.length < 7) {
        week.push({});
      }
    });
    return weeks;
  }

  /// Change calendar mode 'greg' or 'ummAlQura'
  changeCalendarMode() {
    this.mode = this.mode == 'greg' ? 'ummAlQura' : 'greg';
    this.initializeYearsAndMonths();
    this.generatetMonthData(
      '01/' +
      this.periodForm.controls.month.value +
      '/' +
      this.periodForm.controls.year.value
    );
  }

  /// On day clicked handler
  onDayClicked(day: DayInfo) {
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
  markDaySelected(dayInfo: DayInfo) {
    if (dayInfo.selected) {
      dayInfo.selected = false;
      this.multipleSelectedDates = this.multipleSelectedDates.filter(
        (day) => day !== dayInfo
      );
      if (!this.multiple) {
        this.selectedDay = undefined;
      }
    } else {
      if (!this.multiple) {
        this.weeks.forEach((week: any) => {
          week.forEach((day: DayInfo) => {
            day.selected = false;
          });
        });

        dayInfo.selected = true;
        this.selectedDay = dayInfo;
        this.multipleSelectedDates = [dayInfo];
        this.onDaySelect.emit(dayInfo);
      } else {
        dayInfo.selected = true;
        this.onDaySelect.emit(dayInfo);
        if (!this.multipleSelectedDates.includes(dayInfo)) {
          this.multipleSelectedDates.push(dayInfo);
        }
      }
    }
  }

  /// On confirm button clicked
  onConfirmClicked() {
    if (this.multiple) {
      this.onSubmit.emit(this.multipleSelectedDates);
    } else {
      this.onSubmit.emit(this.selectedDay);
    }
  }

  /// Check if date from future
  checkFutureValidation(day: DayInfo): boolean | undefined {
    if (
      this._dateUtilsService.checkPastOrFuture(day?.gD, new Date()) == 'Future'
    ) {
      return true;
    }
  }

  /// Check if passed day is today or not
  checkTodaysDate(day: DayInfo): boolean {
    return (
      this.todaysDate?.gregorian == day?.gD ||
      this.todaysDate?.ummAlQura == day?.uD
    );
  }

  /// Convert english numbers to arabic equivalent
  parseEnglish(englishNum: number | string): string {
    if (!englishNum) return String(englishNum);
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
  parseArabic(arabicNum: string): string {
    return arabicNum.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function (d: string) {
      return String(d.charCodeAt(0) - 1632);
    });
  }

  /// Convert arabic numbers to english number for arithmetic operations
  parseArabicToNumber(arabicNum: string): number {
    const converted = arabicNum.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function (d: string) {
      return String(d.charCodeAt(0) - 1632);
    });
    return Number(converted);
  }
}
