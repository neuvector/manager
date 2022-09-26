import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyModeChartComponent } from './policy-mode-chart.component';

describe('PolicyModeChartComponent', () => {
  let component: PolicyModeChartComponent;
  let fixture: ComponentFixture<PolicyModeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicyModeChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyModeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
