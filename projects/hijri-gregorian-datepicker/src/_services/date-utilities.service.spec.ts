import { TestBed } from '@angular/core/testing';

import { DateUtilitiesService } from './date-utilities.service';

describe('HijriGregorianDatepickerService', () => {
  let service: DateUtilitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateUtilitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
