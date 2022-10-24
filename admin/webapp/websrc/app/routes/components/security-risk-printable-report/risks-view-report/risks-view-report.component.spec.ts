import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RisksViewReportComponent } from './risks-view-report.component';

describe('RisksViewReportComponent', () => {
  let component: RisksViewReportComponent;
  let fixture: ComponentFixture<RisksViewReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RisksViewReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RisksViewReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
