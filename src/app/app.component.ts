import { Component } from '@angular/core';
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
  toggle: boolean = false;
  selectedDate: DayInfo;
  disabledDates: string[] = [];
  showInputDemo: boolean = false;
  inputValue: string = '';
  currentThemeIndex: number = 0;
  themes: ThemeData[] = [];
  
  mode: CalendarMode = CALENDAR_MODES.GREGORIAN;
  
  // Make constants available to template
  CALENDAR_MODES = CALENDAR_MODES;
  
  constructor() {
    this.generateDisabledDates();
    this.loadThemes();
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
    return this.themes[this.currentThemeIndex] || this.themes[0];
  }
  
  get currentThemeName(): string {
    return this.currentTheme?.name || 'Ocean Breeze';
  }

  nextTheme(): void {
    if (this.themes.length === 0) return;
    this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
  }

  previousTheme(): void {
    if (this.themes.length === 0) return;
    this.currentThemeIndex = this.currentThemeIndex === 0 ? this.themes.length - 1 : this.currentThemeIndex - 1;
  }

  selectTheme(index: number): void {
    this.currentThemeIndex = index;
  }

  toggleInputDemo(): void {
    this.showInputDemo = !this.showInputDemo;
  }

  onInputDateSubmit(eventData: any): void {
    console.log('Input Demo - Date Selected: ', eventData);
    if (!Array.isArray(eventData)) {
      const dateStr = eventData?.gD || eventData?.uD || '';
      this.inputValue = dateStr;
      this.showInputDemo = false;
    }
  }

  generateDisabledDates(): void {
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

    this.disabledDates = [
      formatDate(today),
      formatDate(yesterday), 
      formatDate(tomorrow)
    ];
  }

  onSubmit(ev: any) {
    console.log('On Submit ', ev);
  }

  onChange(eventData: any) {
    console.log('On Change ', eventData);
    if (!Array.isArray(eventData)) {
      this.selectedDate = eventData;
    }
  }

  onMonthChangeTest(ev: any) {
    console.log('Month Changed: ', ev);
  }

  onYearChangeTest(ev: any) {
    console.log('Year Changed ', ev);
  }

  toggleMode(): void {
    this.mode = this.mode === CALENDAR_MODES.GREGORIAN ? CALENDAR_MODES.umAlQura : CALENDAR_MODES.GREGORIAN;
  }
}
