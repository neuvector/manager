import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPrintableReportLocationColComponent } from './security-events-printable-report-location-col.component';

describe('SecurityEventsPrintableReportLocationColComponent', () => {
  let component: SecurityEventsPrintableReportLocationColComponent;
  let fixture: ComponentFixture<SecurityEventsPrintableReportLocationColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityEventsPrintableReportLocationColComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsPrintableReportLocationColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
