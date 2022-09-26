/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SwitchersService } from './switchers.service';

describe('Service: Settings', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SwitchersService],
    });
  });

  it('should ...', inject([SwitchersService], (service: SwitchersService) => {
    expect(service).toBeTruthy();
  }));
});
