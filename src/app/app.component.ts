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
  stylesConfig: StylesConfig = {
    backgroundColor: '#000',
    primaryColor: '#116466',
    secondaryColor: '#2c3531',
    todaysDateBgColor: '#116466',
    todaysDateTextColor: '#e3f4f4',
    confirmBtnTextColor: '#e3f4f4',
    disabledDayColor: '#a6a6a6',
    dayColor: '#2c3531',
    dayNameColor: '#116466',
    fontFamily: 'Default-Regular',
    borderRadius: '16px',
  };
  mode: CalendarMode = CALENDAR_MODES.umAlQura;
  constructor() {}

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
