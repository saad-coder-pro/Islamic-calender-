import { Component, HostListener } from '@angular/core';
import { DayInfo } from 'projects/hijri-gregorian-datepicker/src/_interfaces/calendar.model';
import { StylesConfig } from 'projects/hijri-gregorian-datepicker/src/_interfaces/styles-config.model';
import { CalendarMode, CALENDAR_MODES } from 'projects/hijri-gregorian-datepicker/src/_constants/calendar.constants';
import * as themesConfig from 'projects/hijri-gregorian-datepicker/src/themes/themes.json';

interface ThemeData {
  name: string;
  stylesConfig: StylesConfig;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  selectedDate: DayInfo;
  themes: ThemeData[] = [];
  
  // Control properties
  selectedTheme: number = 0;
  calendarMode: CalendarMode = CALENDAR_MODES.GREGORIAN;
  locale: string = 'en';
  canChangeMode: boolean = true;
  multiple: boolean = false;
  rangeSelection: boolean = false;
  showConfirmButton: boolean = true;
  enableAnimations: boolean = true;
  showNavigationArrows: boolean = true;
  isRequired: boolean = true;
  hideMonthPicker: boolean = false;
  hideYearPicker: boolean = false;
  disableDayPicker: boolean = false;
  pastDateValidation: boolean = false;
  futureValidation: boolean = false;
  submitButtonText: string = 'Confirm';
  pastDateValidationMessageEn: string = 'Selected date cannot be in the past!';
  pastDateValidationMessageAr: string = 'التاريخ المحدد لا يمكن ان يكون في الماضي!';
  futureValidationMessageEn: string = 'Selected date cannot be in the future!';
  futureValidationMessageAr: string = 'التاريخ المحدد لا يمكن ان يكون في المستقبل!';
  disabledDatesInput: string = '';
  disabledDates: string[] = [];
  pastYearsLimit: number = 120;
  futureYearsLimit: number = 10;
  
  // Input field demo properties
  showInputCalendar: boolean = false;
  inputFieldValue: string = '';
  
  // Demo toggle property
  activeDemo: 'interactive' | 'input' = 'interactive';
  
  // Make constants available to template
  CALENDAR_MODES = CALENDAR_MODES;
  
  constructor() {
    this.loadThemes();
    this.generateSampleDisabledDates();
  }

  loadThemes(): void {
    // Load themes from JSON file
    if ('default' in themesConfig) {
      this.themes = (themesConfig as { default: ThemeData[] }).default;
    } else {
      this.themes = themesConfig as unknown as ThemeData[];
    }
    
    // If themes still not loaded, create them manually as fallback
    if (!this.themes || this.themes.length === 0) {
      this.themes = [
        {
          name: "Ocean Breeze",
          stylesConfig: {
            backgroundColor: "#d0f0f6",
            primaryColor: "#007c91",
            secondaryColor: "#004d61",
            todaysDateTextColor: "#d0f0f6",
            confirmBtnTextColor: "#d0f0f6",
            disabledDayColor: "#a0a0a0",
            dayNameColor: "#007c91",
            borderRadius: "24px",
            sliderToggleBackground: "#b3d9e0"
          }
        },
        {
          name: "Lavender Dreams",
          stylesConfig: {
            backgroundColor: "#f3e8ff",
            primaryColor: "#9b5de5",
            secondaryColor: "#5a189a",
            todaysDateTextColor: "#f3e8ff",
            confirmBtnTextColor: "#f3e8ff",
            disabledDayColor: "#bdbdbd",
            dayNameColor: "#9b5de5",
            borderRadius: "24px",
            sliderToggleBackground: "#d8c5ff"
          }
        },
        {
          name: "Sunset Glow",
          stylesConfig: {
            backgroundColor: "#ffe5b4",
            primaryColor: "#ff6f00",
            secondaryColor: "#e65100",
            todaysDateTextColor: "#ffe5b4",
            confirmBtnTextColor: "#ffe5b4",
            disabledDayColor: "#a9a9a9",
            dayNameColor: "#ff6f00",
            borderRadius: "24px",
            sliderToggleBackground: "#ffd280"
          }
        },
        {
          name: "Midnight Blue",
          stylesConfig: {
            backgroundColor: "#cfd8dc",
            primaryColor: "#263238",
            secondaryColor: "#37474f",
            todaysDateTextColor: "#cfd8dc",
            confirmBtnTextColor: "#cfd8dc",
            disabledDayColor: "#8e8e8e",
            dayNameColor: "#263238",
            borderRadius: "24px",
            sliderToggleBackground: "#90a4ae"
          }
        },
        {
          name: "Forest Canopy",
          stylesConfig: {
            backgroundColor: "#e0f2f1",
            primaryColor: "#004d40",
            secondaryColor: "#00695c",
            todaysDateTextColor: "#e0f2f1",
            confirmBtnTextColor: "#e0f2f1",
            disabledDayColor: "#9e9e9e",
            dayNameColor: "#004d40",
            borderRadius: "24px",
            sliderToggleBackground: "#a7c7c4"
          }
        },
        {
          name: "Rosewood Elegance",
          stylesConfig: {
            backgroundColor: "#fce4ec",
            primaryColor: "#ad1457",
            secondaryColor: "#880e4f",
            todaysDateTextColor: "#fce4ec",
            confirmBtnTextColor: "#fce4ec",
            disabledDayColor: "#bdbdbd",
            dayNameColor: "#ad1457",
            borderRadius: "24px",
            sliderToggleBackground: "#f8bbd9"
          }
        },
        {
          name: "Icy Mint",
          stylesConfig: {
            backgroundColor: "#e0f7fa",
            primaryColor: "#00acc1",
            secondaryColor: "#006064",
            todaysDateTextColor: "#e0f7fa",
            confirmBtnTextColor: "#e0f7fa",
            disabledDayColor: "#a7a7a7",
            dayNameColor: "#00acc1",
            borderRadius: "24px",
            sliderToggleBackground: "#b3e5fc"
          }
        },
        {
          name: "Golden Sand",
          stylesConfig: {
            backgroundColor: "#fff8e1",
            primaryColor: "#fbc02d",
            secondaryColor: "#f57f17",
            todaysDateTextColor: "#fff8e1",
            confirmBtnTextColor: "#fff8e1",
            disabledDayColor: "#9e9e9e",
            dayNameColor: "#fbc02d",
            borderRadius: "24px",
            sliderToggleBackground: "#fff59d"
          }
        },
        {
          name: "Steel Grey",
          stylesConfig: {
            backgroundColor: "#eceff1",
            primaryColor: "#607d8b",
            secondaryColor: "#455a64",
            todaysDateTextColor: "#eceff1",
            confirmBtnTextColor: "#eceff1",
            disabledDayColor: "#a0a0a0",
            dayNameColor: "#607d8b",
            borderRadius: "24px",
            sliderToggleBackground: "#cfd8dc"
          }
        },
        {
          name: "Coral Reef",
          stylesConfig: {
            backgroundColor: "#fff0f0",
            primaryColor: "#ff4d4d",
            secondaryColor: "#c62828",
            todaysDateTextColor: "#fff0f0",
            confirmBtnTextColor: "#fff0f0",
            disabledDayColor: "#b0b0b0",
            dayNameColor: "#ff4d4d",
            borderRadius: "24px",
            sliderToggleBackground: "#ffcccb"
          }
        }
      ];
    }
  }

  get currentTheme(): ThemeData {
    return this.themes[this.selectedTheme] || this.themes[0];
  }

  onThemeChange(): void {
    // Theme change is handled by the getter
  }

  generateSampleDisabledDates(): void {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Format dates as 'dd/mm/yyyy'
    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      return `${day}/${month}/${year}`;
    };

    const sampleDates = [
      formatDate(today),
      formatDate(yesterday), 
      formatDate(tomorrow)
    ];

    this.disabledDatesInput = sampleDates.join(', ');
    this.disabledDates = sampleDates;
  }

  updateDisabledDates(): void {
    if (!this.disabledDatesInput.trim()) {
      this.disabledDates = [];
      return;
    }

    // Split by comma and clean up each date
    this.disabledDates = this.disabledDatesInput
      .split(',')
      .map(date => date.trim())
      .filter(date => date.length > 0);
  }

  onSubmit(ev: any) {
    console.log('On Submit ', ev);
    // Update selectedDate with confirm button result (handles single, multiple, and range)
    this.selectedDate = ev;
  }

  onChange(eventData: any) {
    console.log('On Change ', eventData);
    // Only update for single selection when not using confirm button
    if (!this.showConfirmButton && !Array.isArray(eventData)) {
      this.selectedDate = eventData;
    }
  }

  onMonthChange(ev: any) {
    console.log('Month Changed: ', ev);
  }

  onYearChange(ev: any) {
    console.log('Year Changed ', ev);
  }

  onInputDateChange(eventData: any) {
    console.log('Input Calendar - On Change ', eventData);
    // Update input field with selected date and close calendar
    if (eventData && !Array.isArray(eventData)) {
      this.inputFieldValue = this.formatDateForInput(eventData);
      this.showInputCalendar = false; // Auto-close calendar when date is selected
    }
  }

  private formatDateForInput(dateData: any): string {
    if (!dateData) return '';
    
    try {
      // Try to format based on available date information
      if (dateData.gD && this.calendarMode === 'greg') {
        return dateData.gD; // Gregorian date
      } else if (dateData.uD && this.calendarMode === 'umAlQura') {
        return dateData.uD; // Hijri date
      } else if (dateData.gD) {
        return dateData.gD; // Fallback to Gregorian
      }
      return JSON.stringify(dateData); // Fallback to JSON if structure unknown
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Selected date';
    }
  }

  // Close calendar when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const calendarElement = document.querySelector('.input-calendar-dropdown');
    const inputElement = document.querySelector('.input-field');
    
    if (!calendarElement?.contains(target) && !inputElement?.contains(target)) {
      this.showInputCalendar = false;
    }
  }
}
