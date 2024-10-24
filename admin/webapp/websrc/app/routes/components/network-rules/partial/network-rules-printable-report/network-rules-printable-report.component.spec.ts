import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkRulesPrintableReportComponent } from './network-rules-printable-report.component';

describe('NetworkRulesPrintableReportComponent', () => {
  let component: NetworkRulesPrintableReportComponent;
  let fixture: ComponentFixture<NetworkRulesPrintableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkRulesPrintableReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkRulesPrintableReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
