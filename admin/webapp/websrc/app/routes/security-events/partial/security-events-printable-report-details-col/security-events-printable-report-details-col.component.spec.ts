import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPrintableReportDetailsColComponent } from './security-events-printable-report-details-col.component';

describe('SecurityEventsPrintableReportDetailsColComponent', () => {
  let component: SecurityEventsPrintableReportDetailsColComponent;
  let fixture: ComponentFixture<SecurityEventsPrintableReportDetailsColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityEventsPrintableReportDetailsColComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsPrintableReportDetailsColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
