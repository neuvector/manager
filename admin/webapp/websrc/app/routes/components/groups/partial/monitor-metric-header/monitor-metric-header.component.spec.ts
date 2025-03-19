import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorMetricHeaderComponent } from './monitor-metric-header.component';

describe('MonitorMetricHeaderComponent', () => {
  let component: MonitorMetricHeaderComponent;
  let fixture: ComponentFixture<MonitorMetricHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonitorMetricHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitorMetricHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
