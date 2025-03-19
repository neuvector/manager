import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorMetricSwitchComponent } from './monitor-metric-switch.component';

describe('MonitorMetricSwitchComponent', () => {
  let component: MonitorMetricSwitchComponent;
  let fixture: ComponentFixture<MonitorMetricSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonitorMetricSwitchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitorMetricSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
