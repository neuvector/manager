import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPrintableReportComponent } from './dashboard-printable-report.component';

describe('DashboardPrintableReportComponent', () => {
  let component: DashboardPrintableReportComponent;
  let fixture: ComponentFixture<DashboardPrintableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardPrintableReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardPrintableReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
