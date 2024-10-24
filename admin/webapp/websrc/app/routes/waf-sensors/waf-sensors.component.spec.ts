import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WafSensorsComponent } from './waf-sensors.component';

describe('WafSensorsComponent', () => {
  let component: WafSensorsComponent;
  let fixture: ComponentFixture<WafSensorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WafSensorsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WafSensorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
