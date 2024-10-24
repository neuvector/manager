import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportPackagesColComponent } from './risk-view-report-packages-col.component';

describe('RiskViewReportPackagesColComponent', () => {
  let component: RiskViewReportPackagesColComponent;
  let fixture: ComponentFixture<RiskViewReportPackagesColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskViewReportPackagesColComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportPackagesColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
