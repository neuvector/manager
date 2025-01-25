import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WafSensorsPageComponent } from './waf-sensors-page.component';

describe('WafSensorsPageComponent', () => {
  let component: WafSensorsPageComponent;
  let fixture: ComponentFixture<WafSensorsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WafSensorsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WafSensorsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
