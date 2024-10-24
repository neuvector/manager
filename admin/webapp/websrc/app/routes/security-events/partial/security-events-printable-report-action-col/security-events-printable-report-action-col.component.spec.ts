import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPrintableReportActionColComponent } from './security-events-printable-report-action-col.component';

describe('SecurityEventsPrintableReportActionColComponent', () => {
  let component: SecurityEventsPrintableReportActionColComponent;
  let fixture: ComponentFixture<SecurityEventsPrintableReportActionColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityEventsPrintableReportActionColComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      SecurityEventsPrintableReportActionColComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
