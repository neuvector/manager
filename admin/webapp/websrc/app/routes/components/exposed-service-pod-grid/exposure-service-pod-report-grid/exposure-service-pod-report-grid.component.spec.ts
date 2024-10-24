import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposureServicePodReportGridComponent } from './exposure-service-pod-report-grid.component';

describe('ExposureServicePodReportGridComponent', () => {
  let component: ExposureServicePodReportGridComponent;
  let fixture: ComponentFixture<ExposureServicePodReportGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExposureServicePodReportGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposureServicePodReportGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
