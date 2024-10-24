import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkRulesReportChartComponent } from './network-rules-report-chart.component';

describe('NetworkRulesReportChartComponent', () => {
  let component: NetworkRulesReportChartComponent;
  let fixture: ComponentFixture<NetworkRulesReportChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkRulesReportChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkRulesReportChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
