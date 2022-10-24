import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportAppendixPackagesComponent } from './risk-view-report-appendix-packages.component';

describe('RiskViewReportAppendixPackagesComponent', () => {
  let component: RiskViewReportAppendixPackagesComponent;
  let fixture: ComponentFixture<RiskViewReportAppendixPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskViewReportAppendixPackagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportAppendixPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
