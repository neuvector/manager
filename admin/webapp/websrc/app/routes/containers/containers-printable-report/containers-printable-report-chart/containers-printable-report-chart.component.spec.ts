import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainersPrintableReportChartComponent } from './containers-printable-report-chart.component';

describe('ContainersPrintableReportChartComponent', () => {
  let component: ContainersPrintableReportChartComponent;
  let fixture: ComponentFixture<ContainersPrintableReportChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContainersPrintableReportChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainersPrintableReportChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
