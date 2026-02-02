import { Component } from '@angular/core';
import { DayInfo } from 'projects/hijri-gregorian-datepicker/src/_interfaces/calendar.model';
import { StylesConfig } from 'projects/hijri-gregorian-datepicker/src/_interfaces/styles-config.model';
import { CalendarMode, CALENDAR_MODES } from 'projects/hijri-gregorian-datepicker/src/_constants/calendar.constants';

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
  stylesConfig: StylesConfig = {
    backgroundColor: '#000',
    primaryColor: '#116466',
    secondaryColor: '#2c3531',
    todaysDateTextColor: '#e3f4f4',
    confirmBtnTextColor: '#e3f4f4',
    disabledDayColor: '#FF0000',
    dayNameColor: '#116466',
    fontFamily: 'Default-Regular',
    borderRadius: '16px',
  };
  mode: CalendarMode = CALENDAR_MODES.GREGORIAN;
  
  constructor() {
    this.generateDisabledDates();
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

  toggleMode() {
    this.mode = this.mode === CALENDAR_MODES.GREGORIAN ? CALENDAR_MODES.umAlQura : CALENDAR_MODES.GREGORIAN;
  }
}
