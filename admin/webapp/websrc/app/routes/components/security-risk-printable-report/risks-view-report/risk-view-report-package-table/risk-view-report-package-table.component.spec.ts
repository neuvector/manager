import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportPackageTableComponent } from './risk-view-report-package-table.component';

describe('RiskViewReportPackageTableComponent', () => {
  let component: RiskViewReportPackageTableComponent;
  let fixture: ComponentFixture<RiskViewReportPackageTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskViewReportPackageTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportPackageTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
