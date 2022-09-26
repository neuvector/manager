/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

import { SwitchersService } from '../../core/switchers/switchers.service';

describe('Component: Footer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SwitchersService],
    }).compileComponents();
  });

  it('should create an instance', async(
    inject([SwitchersService], switchersService => {
      let component = new FooterComponent(switchersService);
      expect(component).toBeTruthy();
    })
  ));
});
